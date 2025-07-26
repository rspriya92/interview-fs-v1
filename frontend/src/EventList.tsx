// frontend/src/EventList.tsx

import { useState, useEffect } from 'react';
import { Button, Table, Alert, Loading } from 'react-daisyui';
import { useNavigate } from 'react-router-dom'; // Import Link

// Define a type for your event data (optional but good practice for TypeScript)
interface Event {
    id: string;
    eventName: string;
    description: string;
    eventDate: string;
    eventStartTime: string;
    eventEndTime: string;
    status?: string;
}

interface EventListProps {
    onBackToHome: () => void; // Function to navigate back to the home page
}

function EventList({ onBackToHome }: EventListProps) {
    const [events, setEvents] = useState<Event[]>([]); // State to store fetched events
    const [loading, setLoading] = useState(false); // State to manage loading status
    const [error, setError] = useState(''); // State to store any error messages
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [inviteMode, setInviteMode] = useState(false);
    const [attendeeEmail, setAttendeeEmail] = useState('');
    const [inviteMessage, setInviteMessage] = useState('');
    const [inviteStatus, setInviteStatus] = useState<'Attending' | 'Not Attending' | 'Maybe' | ''>('');
    const [publishError, setPublishError] = useState('');
    const [publishSuccess, setPublishSuccess] = useState('');
    const navigate = useNavigate();

    // Function to fetch events from the backend API
    const fetchEvents = async () => {
        setLoading(true); // Set loading to true when fetching starts
        setError(''); // Clear any previous errors

        try {
            const res = await fetch('/api/events'); // Make GET request to your backend
            console.log('in event list')
            if (!res.ok) {
                // If response is not OK (e.g., 404, 500), throw an error
                const errorText = await res.text();
                throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
            }

            const data: Event[] = await res.json(); // Parse the JSON response
            setEvents(data); // Update the events state with fetched data

        } catch (err: any) {
            // Catch and display any errors during the fetch operation
            setError(`Failed to fetch events: ${err.message}`);
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false); // Set loading to false when fetching completes (success or failure)
        }
    };

    // useEffect to fetch events automatically when the component mounts
    // This ensures the list is populated when the user navigates to this page
    useEffect(() => {
        fetchEvents();
    }, []); // Empty dependency array means this runs only once on mount

    // Fix: handlePublish and handleCancel should accept an event argument
    const handlePublish = async (event: Event) => {
        setPublishError('');
        setPublishSuccess('');
        try {
            const res = await fetch(`/api/events/${event.id}/publish`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText);
            }
            setPublishSuccess('Event published successfully!');
            setSelectedEvent({ ...event, status: 'published' });
            fetchEvents();
        } catch (err: any) {
            setPublishError('Failed to publish event: ' + err.message);
        }
    };

    const handleCancel = async (event: Event) => {
        setPublishError('');
        setPublishSuccess('');
        try {
            const res = await fetch(`/api/events/${event.id}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText);
            }
            setPublishSuccess('Event cancelled successfully!');
            setSelectedEvent({ ...event, status: 'Cancelled' });
            fetchEvents();
        } catch (err: any) {
            setPublishError('Failed to cancel event: ' + err.message);
        }
    };

    const handleView = (event: Event) => {
        window.open(`/event/${event.id}`, '_blank');
    };

    // Invite functionality
    const handleInvite = (event: Event) => {
        navigate(`/invite/${event.id}`);
    };

    const handleSendInvite = async (status: 'Attending' | 'Not Attending' | 'Maybe') => {
        setInviteMessage('');
        if (!attendeeEmail.trim()) {
            setInviteMessage('Please enter attendee email.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) {
            setInviteMessage('Please enter a valid email address.');
            return;
        }
        try {
            const res = await fetch(`/api/events/${selectedEvent?.id}/attendees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attendeeEmail,
                    responseStatus: status,
                }),
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText);
            }
            setInviteStatus(status);
            setInviteMessage(`RSVP sent: ${status}`);
        } catch (err: any) {
            setInviteMessage('Failed to send RSVP: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center py-8 px-4">
            {/* Main content wrapper */}
            <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-lg border border-blue-100">
                <h2 className="text-3xl font-extrabold text-blue-800 mb-6 text-center">All Created Events</h2>
                <div className="flex justify-center mb-6 gap-4">
                    <Button
                        color="primary"
                        onClick={fetchEvents}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors duration-200"
                    >
                        {loading ? 'Loading Events...' : 'Refresh Event List'}
                    </Button>
                    <Button
                        color="ghost"
                        onClick={onBackToHome}
                        className="bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 font-medium py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        Back to Home
                    </Button>
                </div>
    
                {error && <Alert status="error" className="mb-4 bg-red-50 border-red-300 text-red-700 p-3 rounded-md">{error}</Alert>}
                {loading && (
                    <div className="flex justify-center items-center text-blue-600">
                        <Loading size="lg" className="mr-2" /> <span className="text-blue-600">Loading events...</span>
                    </div>
                )}
                {!loading && !error && events.length === 0 && (
                    <Alert status="info" className="mb-4 bg-blue-100 border-blue-300 text-blue-700 p-3 rounded-md">No events found. Create an event first!</Alert>
                )}
    
                {/* Only show table if not in invite mode and no event is selected */}
                {!inviteMode && !selectedEvent && !loading && !error && events.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-emerald-200 shadow-sm"> {/* Changed border to emerald */}
                        <Table className="table-zebra w-full text-emerald-700"> {/* Changed table text to emerald */}
                            <thead>
                                <tr className="bg-emerald-100"> {/* Changed header background to emerald */}
                                    <th className="text-emerald-800 py-3 px-4 font-semibold text-left rounded-tl-lg">Event Name</th>
                                    <th className="text-emerald-800 py-3 px-4 font-semibold text-left">Date</th>
                                    <th className="text-emerald-800 py-3 px-4 font-semibold text-left">Start Time</th>
                                    <th className="text-emerald-800 py-3 px-4 font-semibold text-left">End Time</th>
                                    <th className="text-emerald-800 py-3 px-4 font-semibold text-left">Status</th>
                                    <th className="text-emerald-800 py-3 px-4 font-semibold text-left rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event, index) => (
                                    <tr key={event.id} className="odd:bg-emerald-50"> {/* Changed alternate row to emerald */}
                                        <td className={`py-2 px-4 ${index === events.length - 1 ? 'rounded-bl-lg' : ''}`}>{event.eventName}</td>
                                        <td className="py-2 px-4">{event.eventDate}</td>
                                        <td className="py-2 px-4">{event.eventStartTime}</td>
                                        <td className="py-2 px-4">{event.eventEndTime}</td>
                                        <td className="py-2 px-4">{event.status || 'draft'}</td>
                                        <td className={`py-2 px-4 ${index === events.length - 1 ? 'rounded-br-lg' : ''}`}>
                                            <div className="flex gap-2">
                                                {/* Publish Button with Icon */}
                                                <Button
                                                    color="ghost"
                                                    size="sm"
                                                    onClick={() => handlePublish(event)}
                                                    disabled={event.status === 'published' || event.status === 'Cancelled'}
                                                    className="!bg-transparent !p-1 text-emerald-600 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                                    title={event.status === 'published' ? 'Event Published' : 'Publish Event'}
                                                >
                                                    {event.status === 'published' ? '✅' : '📤'}
                                                </Button>
                                                {/* View Button with Icon */}
                                                <Button
                                                    color="ghost"
                                                    size="sm"
                                                    onClick={() => handleView(event)}
                                                    className="!bg-transparent !p-1 text-emerald-600 hover:text-emerald-800 transition-colors duration-200"
                                                    title="View Event Details"
                                                >
                                                    👁️
                                                </Button>
                                                {/* Invite Button with Icon */}
                                                <Button
                                                    color="ghost"
                                                    size="sm"
                                                    onClick={() => handleInvite(event)}
                                                    className="!bg-transparent !p-1 text-emerald-600 hover:text-emerald-800 transition-colors duration-200"
                                                    title="Invite Attendees"
                                                >
                                                    ✉️
                                                </Button>
                                                {/* Cancel Button with Icon */}
                                                <Button
                                                    color="ghost"
                                                    size="sm"
                                                    onClick={() => handleCancel(event)}
                                                    disabled={event.status === 'Cancelled'}
                                                    className="!bg-transparent !p-1 text-emerald-600 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                                    title={event.status === 'Cancelled' ? 'Event Cancelled' : 'Cancel Event'}
                                                >
                                                    {event.status === 'Cancelled' ? '❌' : '🚫'}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
    
                {/* Invite/RSVP UI */}
                {inviteMode && selectedEvent && (
                    <div className="mt-8 p-6 border-t border-emerald-200 bg-emerald-50 rounded-lg shadow-inner"> {/* Changed border and background to emerald */}
                        <h3 className="text-2xl font-semibold text-emerald-800 mb-4">Invite for: {selectedEvent.eventName}</h3> {/* Changed text to emerald */}
                        <p className="mb-2 text-emerald-700"><strong>Date:</strong> {selectedEvent.eventDate}</p>
                        <p className="mb-2 text-emerald-700"><strong>Start Time:</strong> {selectedEvent.eventStartTime}</p>
                        <p className="mb-2 text-emerald-700"><strong>End Time:</strong> {selectedEvent.eventEndTime}</p>
                        <div className="mb-4">
                            <label htmlFor="attendeeEmail" className="block font-medium text-emerald-700 mb-2">Attendee Email:</label> {/* Changed text to emerald */}
                            <input
                                type="email"
                                id="attendeeEmail"
                                className="w-full p-2 border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-md transition-all duration-200" // Changed border and focus ring to emerald
                                value={attendeeEmail}
                                onChange={(e) => setAttendeeEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                required
                            />
                        </div>
                        <div className="flex gap-4 mb-4">
                            <Button
                                color="success"
                                onClick={() => handleSendInvite('Attending')}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-200"
                            >
                                Yes
                            </Button>
                            <Button
                                color="error"
                                onClick={() => handleSendInvite('Not Attending')}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-200"
                            >
                                No
                            </Button>
                            <Button
                                color="warning"
                                onClick={() => handleSendInvite('Maybe')}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-200"
                            >
                                Maybe
                            </Button>
                        </div>
                        {inviteMessage && <Alert status={inviteStatus ? 'success' : 'error'} className={`mb-2 ${inviteStatus ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-red-50 border-red-300 text-red-700'} p-3 rounded-md`}>{inviteMessage}</Alert>} {/* Changed alert background/border/text to emerald */}
                        <Button
                            color="ghost"
                            className="mt-4 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-medium py-2 px-4 rounded-md transition-colors duration-200" // Changed border and text to emerald
                            onClick={() => { setInviteMode(false); setSelectedEvent(null); }}
                        >
                            Back to List
                        </Button>
                    </div>
                )}
    
                {/* Only show selected event details if an event is selected and not in invite mode */}
                {selectedEvent && !inviteMode && (
                    <div className="mt-8 p-6 border-t border-emerald-200 bg-emerald-50 rounded-lg shadow-inner"> {/* Changed border and background to emerald */}
                        <h3 className="text-2xl font-semibold text-emerald-800 mb-4">{selectedEvent.eventName}</h3> {/* Changed text to emerald */}
                        <p className="mb-2 text-emerald-700"><strong>Description:</strong> {selectedEvent.description}</p>
                        <p className="mb-2 text-emerald-700"><strong>Date:</strong> {selectedEvent.eventDate}</p>
                        <p className="mb-2 text-emerald-700"><strong>Start Time:</strong> {selectedEvent.eventStartTime}</p>
                        <p className="mb-2 text-emerald-700"><strong>End Time:</strong> {selectedEvent.eventEndTime}</p>
                        <p className="mb-2 text-emerald-700"><strong>Status:</strong> {selectedEvent.status || 'draft'}</p>
                        {publishError && <Alert status="error" className="mb-2 bg-red-50 border-red-300 text-red-700 p-3 rounded-md">{publishError}</Alert>}
                        {publishSuccess && <Alert status="success" className="mb-2 bg-emerald-100 border-emerald-300 text-emerald-700 p-3 rounded-md">{publishSuccess}</Alert>} {/* Changed alert background/border/text to emerald */}
                        <Button
                            color="ghost"
                            className="mt-4 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-medium py-2 px-4 rounded-md transition-colors duration-200" // Changed border and text to emerald
                            onClick={() => setSelectedEvent(null)}
                        >
                            Back to List
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EventList;