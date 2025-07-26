// db_create_attendees.ts

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url'; // Required for __dirname in ES module scope

// Get __dirname equivalent in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to your database file.
// This assumes 'event.db' is located in the 'src' directory,
// and the compiled script will be in a 'dist' directory sibling to 'src'.
const dbPath = path.join(__dirname, '..', 'event.db');

let db: Database.Database | null = null;

try {
  // Open the database connection. If the file doesn't exist, it will be created.
  db = new Database(dbPath);

  // Optional: Enable verbose mode for debugging to see SQL statements executed
  // db.verbose();

  console.log('Attempting to create/ensure "eventAttendees" table...');

  // Create the 'eventAttendees' table if it doesn't already exist.
  // This table tracks attendee responses for events.
  db.prepare(`
    CREATE TABLE IF NOT EXISTS eventAttendees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId INTEGER NOT NULL,          -- Foreign key to the events table
      attendeeEmail TEXT NOT NULL,       -- Email of the attendee
      responseStatus TEXT NOT NULL DEFAULT 'Pending', -- RSVP status (e.g., Attending, Not Attending, Maybe)
      rsvpDate DATETIME DEFAULT CURRENT_TIMESTAMP, -- When the RSVP was recorded
      notes TEXT,                        -- Any additional notes from the attendee
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp of record creation
      
      -- Foreign key constraint to link with the 'events' table
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
      
      -- Ensure responseStatus is one of the allowed values
      CHECK (responseStatus IN ('Pending', 'Attending', 'Not Attending', 'Maybe')),
      
      -- Ensure an attendee can only RSVP once per event
      UNIQUE (eventId, attendeeEmail)
    )
  `).run();

  console.log('✅ "eventAttendees" table created/ensured successfully!');

} catch (error: any) {
  console.error(`❌ Error initializing "eventAttendees" table: ${error.message}`);
  // In a real application, you might want to exit the process or handle this more gracefully.
  process.exit(1);
} finally {
  // Always close the database connection when done with initialization
  if (db) {
    db.close();
    console.log('Database connection closed after "eventAttendees" table initialization.');
  }
}
