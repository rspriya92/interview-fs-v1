// backend/attendees.ts

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';

// Define interfaces for type safety
interface CreateAttendeeRequestBody {
    eventId: number; // The ID of the event the attendee is responding to
    attendeeEmail: string;
    responseStatus?: 'Pending' | 'Attending' | 'Not Attending' | 'Maybe'; // Optional, with default
    notes?: string;
}

// Define a type for the response status that can be returned from the DB
type ResponseStatusType = 'Pending' | 'Attending' | 'Not Attending' | 'Maybe';

interface Attendee {
    id: number;
    eventId: number;
    attendeeEmail: string;
    responseStatus: ResponseStatusType;
    rsvpDate: string;
    notes?: string;
    created_at: string;
}

interface AttendeeEvent {
    id: string; // Event ID
    eventName: string;
    eventDate: string;
    eventStartTime: string;
    eventEndTime: string;
    responseStatus: string; // Attendee's response status for this event
}

// Define interface for Event with RSVP Counts (for the /events-with-rsvp-counts endpoint)
interface EventWithRsvpCounts {
    id: number;
    creatorEmail: string;
    eventName: string;
    description: string;
    targetedAttendees: number;
    eventDate: string;
    eventTime: string;
    created_at: string;
    attendingCount: number;
    notAttendingCount: number;
    maybeCount: number;
    pendingCount: number;
    totalRsvps: number; // This will be calculated on the fly in the query
}


// This function creates and returns an Express Router instance.
// It takes the database connection 'db' as an argument, allowing API endpoints to interact with the database.
export function createAttendeesRouter(db: Database.Database): Router {
    const router = Router();

    // --- API Endpoints for Attendees ---

    // 1. POST /api/events/:eventId/attendees - Add or Update an attendee response and update counters
    router.post('/events/:eventId/attendees', (req: Request<{ eventId: string }, {}, CreateAttendeeRequestBody>, res: Response) => {
        const eventId = parseInt(req.params.eventId); // Get eventId from URL parameters
        const { attendeeEmail, responseStatus, notes } = req.body;

        // --- Server-side Validation ---
        if (isNaN(eventId) || eventId <= 0) {
            return res.status(400).json({ error: 'Invalid Event ID provided.' });
        }
        if (!attendeeEmail) {
            return res.status(400).json({ error: 'Attendee email is required.' });
        }
        // Basic email format validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) {
            return res.status(400).json({ error: 'Invalid email format.' });
        }
        // Validate responseStatus against allowed values
        const allowedStatuses = ['Pending', 'Attending', 'Not Attending', 'Maybe'];
        if (responseStatus && !allowedStatuses.includes(responseStatus)) {
            return res.status(400).json({ error: `Invalid response status. Must be one of: ${allowedStatuses.join(', ')}` });
        }

        const finalResponseStatus = responseStatus || 'Pending'; // Use default if not provided

        try {
            // Start a database transaction for atomicity
            db.exec('BEGIN TRANSACTION;');

            // 1. Check if the attendee already exists for this event
            // Cast the result to ensure TypeScript knows its structure
            const existingAttendee = db.prepare('SELECT responseStatus FROM eventAttendees WHERE eventId = ? AND attendeeEmail = ?').get(eventId, attendeeEmail) as { responseStatus: ResponseStatusType } | undefined;

            if (existingAttendee) {
                // If attendee exists, it's an UPDATE operation
                const oldResponseStatus = existingAttendee.responseStatus;

                // Update the eventAttendees table
                db.prepare(`
                    UPDATE eventAttendees
                    SET responseStatus = ?, notes = ?, rsvpDate = CURRENT_TIMESTAMP
                    WHERE eventId = ? AND attendeeEmail = ?
                `).run(finalResponseStatus, notes || null, eventId, attendeeEmail);

                // Decrement the old counter
                if (oldResponseStatus === 'Attending') db.prepare('UPDATE events SET attendingCount = attendingCount - 1 WHERE id = ?').run(eventId);
                else if (oldResponseStatus === 'Not Attending') db.prepare('UPDATE events SET notAttendingCount = notAttendingCount - 1 WHERE id = ?').run(eventId);
                else if (oldResponseStatus === 'Maybe') db.prepare('UPDATE events SET maybeCount = maybeCount - 1 WHERE id = ?').run(eventId);
                else if (oldResponseStatus === 'Pending') db.prepare('UPDATE events SET pendingCount = pendingCount - 1 WHERE id = ?').run(eventId);

                // Increment the new counter
                if (finalResponseStatus === 'Attending') db.prepare('UPDATE events SET attendingCount = attendingCount + 1 WHERE id = ?').run(eventId);
                else if (finalResponseStatus === 'Not Attending') db.prepare('UPDATE events SET notAttendingCount = notAttendingCount + 1 WHERE id = ?').run(eventId);
                else if (finalResponseStatus === 'Maybe') db.prepare('UPDATE events SET maybeCount = maybeCount + 1 WHERE id = ?').run(eventId);
                else if (finalResponseStatus === 'Pending') db.prepare('UPDATE events SET pendingCount = pendingCount + 1 WHERE id = ?').run(eventId);

                db.exec('COMMIT;');
                console.log(`Attendee response updated: Event ID=${eventId}, Attendee Email=${attendeeEmail}. Status changed from ${oldResponseStatus} to ${finalResponseStatus}.`);
                res.status(200).json({ message: 'Attendee response updated successfully!' });

            } else {
                // If attendee does not exist, it's an INSERT operation
                // First, check if the event exists before inserting an attendee
                const eventExists = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
                if (!eventExists) {
                    db.exec('ROLLBACK;'); // Rollback if event not found
                    return res.status(404).json({ error: `Event with ID ${eventId} not found.` });
                }

                db.prepare(`
                    INSERT INTO eventAttendees (eventId, attendeeEmail, responseStatus, notes)
                    VALUES (?, ?, ?, ?)
                `).run(eventId, attendeeEmail, finalResponseStatus, notes || null);

                // Increment the new counter
                if (finalResponseStatus === 'Attending') db.prepare('UPDATE events SET attendingCount = attendingCount + 1 WHERE id = ?').run(eventId);
                else if (finalResponseStatus === 'Not Attending') db.prepare('UPDATE events SET notAttendingCount = notAttendingCount + 1 WHERE id = ?').run(eventId);
                else if (finalResponseStatus === 'Maybe') db.prepare('UPDATE events SET maybeCount = maybeCount + 1 WHERE id = ?').run(eventId);
                else if (finalResponseStatus === 'Pending') db.prepare('UPDATE events SET pendingCount = pendingCount + 1 WHERE id = ?').run(eventId);

                db.exec('COMMIT;');
                console.log(`Attendee response recorded: Event ID=${eventId}, Attendee Email=${attendeeEmail}, Status=${finalResponseStatus}.`);
                res.status(201).json({ message: 'Attendee response recorded successfully!' });
            }

        } catch (error: any) {
            db.exec('ROLLBACK;'); // Rollback on any error
            // Handle specific SQLite errors, e.g., unique constraint violation, if not caught by initial check
            if (error.message.includes('UNIQUE constraint failed: eventAttendees.eventId, eventAttendees.attendeeEmail')) {
                return res.status(409).json({ error: 'This attendee has already responded for this event.' });
            }
            console.error('❌ Database transaction error for attendee response:', error.message);
            res.status(500).json({ error: 'Failed to record/update attendee response.', details: error.message });
        }
    });

    // 2. GET /api/events/:eventId/attendees - Retrieve all attendee responses for a specific event
    router.get('/events/:eventId/attendees', (req: Request<{ eventId: string }>, res: Response) => {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId) || eventId <= 0) {
            return res.status(400).json({ error: 'Invalid Event ID provided.' });
        }

        try {
            // Check if the event exists
            const eventExists = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
            if (!eventExists) {
                return res.status(404).json({ error: `Event with ID ${eventId} not found.` });
            }

            // Retrieve all attendees for the given eventId
            const attendees = db.prepare('SELECT * FROM eventAttendees WHERE eventId = ?').all(eventId) as Attendee[];
            res.status(200).json(attendees);

        } catch (error: any) {
            console.error('❌ Database fetch error for attendees:', error.message);
            res.status(500).json({ error: 'Failed to retrieve attendees for event.', details: error.message });
        }
    });

    // 2. GET /api/attendee/:email/events - Get all events responded to by an attendee
    router.get('/attendee/:email/events', (req: Request, res: Response) => {
        const attendeeEmail = req.params.email;
        if (!attendeeEmail) {
            return res.status(400).json({ error: 'Attendee email is required.' });
        }

        try {
            // Join attendees and events to get event details and response status
            const stmt = db.prepare(`
                SELECT
                    events.id,
                    events.eventName,
                    events.eventDate,
                    events.eventStartTime,
                    events.eventEndTime,
                    eventAttendees.responseStatus
                FROM eventAttendees
                JOIN events ON eventAttendees.eventId = events.id
                WHERE eventAttendees.attendeeEmail = ?
            `);
            const events = stmt.all(attendeeEmail);
            res.json(events);
        } catch (err: any) {
            res.status(500).json({ error: 'Failed to fetch attendee events', details: err.message });
        }
    });

    // 4. GET /api/events-with-rsvp-counts - Retrieve all events with their pre-calculated RSVP statistics
    router.get('/events-with-rsvp-counts', (_req: Request, res: Response) => {
        try {
            // Now, we just select the pre-calculated counts directly from the events table
            const eventsWithCounts = db.prepare(`
                SELECT
                    id,
                    creatorEmail,
                    eventName,
                    description,
                    targetedAttendees,
                    eventDate,
                    eventTime,
                    created_at,
                    attendingCount,
                    notAttendingCount,
                    maybeCount,
                    pendingCount,
                    (attendingCount + notAttendingCount + maybeCount + pendingCount) AS totalRsvps
                FROM
                    events
                ORDER BY
                    created_at DESC
            `).all() as EventWithRsvpCounts[]; // Explicitly cast to EventWithRsvpCounts[]

            res.status(200).json(eventsWithCounts);

        } catch (error: any) {
            console.error('❌ Database fetch error for events with RSVP counts:', error.message);
            res.status(500).json({ error: 'Failed to retrieve event RSVP statistics.', details: error.message });
        }
    });

    return router;
}
