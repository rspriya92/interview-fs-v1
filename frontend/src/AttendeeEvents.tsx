// frontend/src/AttendeeEvents.tsx

import { useState, useEffect } from 'react';
import { Table, Alert, Select, Loading, Button } from 'react-daisyui';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface AttendeeEvent {
  id: string;
  eventName: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  responseStatus: string;
}

interface AttendeeEventsProps {
  initialEmail: string; // Email is now mandatory as it's displayed and used for fetch
  onBackToHome: () => void; // Callback to navigate back to the home page or previous page
}

function AttendeeEvents({ initialEmail, onBackToHome }: AttendeeEventsProps) {
  const [email] = useState(initialEmail);
  const [events, setEvents] = useState<AttendeeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate(); // Initialize navigate hook

  // Fetch events when the component mounts or if initialEmail changes
  useEffect(() => {
    if (email) { // Only fetch if email is provided
      fetchAttendeeEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]); // Dependency on 'email' (which is set by initialEmail)

  const fetchAttendeeEvents = async () => {
    setLoading(true);
    setError('');
    try {
      // Encode the email to handle special characters in the URL
      const res = await fetch(`/api/attendee/${encodeURIComponent(email)}/events`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      const data: AttendeeEvent[] = await res.json();
      setEvents(data);
    } catch (err: any) {
      setError('Failed to fetch events: ' + err.message);
      console.error('Error fetching attendee events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditResponse = (eventId: string, attendeeEmail: string) => {
    // Navigate to the InviteAttendee page, passing eventId in params and email in state
    navigate(`/invite/${eventId}`, { state: { attendeeEmail: attendeeEmail } });
  };

  const filteredEvents =
    filter === 'all'
      ? events
      : events.filter(ev => ev.responseStatus === filter);

  // Collect unique response statuses for filter dropdown
  // Ensure 'All' is always an option
  const responseOptions = Array.from(
    new Set(events.map(ev => ev.responseStatus))
  ).sort(); // Sort options alphabetically

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-start px-4 py-8">
      {/* Email Banner - Moved to the very top */}
      <div className="w-full max-w-2xl bg-blue-100 text-blue-800 p-4 rounded-md mb-6 text-center font-semibold text-lg shadow-sm">
        Welcome <span className="text-blue-900">{email}</span>
      </div>

      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-xl">
        {/* Filter Dropdown (only show if there are events) */}
        {events.length > 0 && (
          <div className="mb-4 flex gap-2 items-center justify-end"> {/* Aligned to end */}
            <label htmlFor="responseFilter" className="font-medium text-gray-700">Filter by Response:</label>
            <Select
              id="responseFilter"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="min-w-[120px] rounded-md border-gray-300 shadow-sm"
            >
              <option value="all">All</option>
              {responseOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
          </div>
        )}

        {/* Message Display Area */}
        {error && <Alert status="error" className="mb-4">{error}</Alert>}
        {loading && (
          <Alert status="info" className="mb-4 flex items-center justify-center">
            <Loading size="sm" className="mr-2" /> Loading events...
          </Alert>
        )}

        {/* Table to display filtered events */}
        {!loading && filteredEvents.length > 0 && (
          <div className="overflow-x-auto">
            <Table className="w-full bg-white rounded-lg overflow-hidden shadow-md">
              <thead>
                <tr className="bg-blue-600 text-white"> {/* Darker blue for header */}
                  <th className="font-bold py-3 px-2">Event Name</th>
                  <th className="font-bold py-3 px-2">Date</th>
                  <th className="font-bold py-3 px-2">Start Time</th>
                  <th className="font-bold py-3 px-2">End Time</th>
                  <th className="font-bold py-3 px-2">Your Response</th>
                  <th className="font-bold py-3 px-2">Actions</th> {/* New column for action button */}
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((ev, idx) => (
                  <tr
                    key={ev.id}
                    className={idx % 2 === 0 ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-100"}
                  >
                    <td className="py-2 px-2">{ev.eventName}</td>
                    <td className="py-2 px-2">{ev.eventDate}</td>
                    <td className="py-2 px-2">{ev.eventStartTime}</td>
                    <td className="py-2 px-2">{ev.eventEndTime}</td>
                    <td className="py-2 px-2 font-medium">
                      {/* Apply color based on response status for better visibility */}
                      {ev.responseStatus === 'Attending' && <span className="text-green-600">{ev.responseStatus}</span>}
                      {ev.responseStatus === 'Not Attending' && <span className="text-red-600">{ev.responseStatus}</span>}
                      {ev.responseStatus === 'Maybe' && <span className="text-yellow-600">{ev.responseStatus}</span>}
                      {ev.responseStatus === 'Pending' && <span className="text-gray-500">{ev.responseStatus}</span>}
                      {!['Attending', 'Not Attending', 'Maybe', 'Pending'].includes(ev.responseStatus) && ev.responseStatus}
                    </td>
                    <td className="py-2 px-2">
                        <Button
                            color="info" // Use a suitable color, e.g., info or neutral
                            size="sm"
                            onClick={() => handleEditResponse(ev.id, email)} // Pass event ID and attendee email
                        >
                            Edit Response
                        </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {/* Message if no events found for the email */}
        {!loading && events.length === 0 && email && !error && (
          <Alert status="info" className="mt-4">No events found for this email, or you haven't responded to any yet.</Alert>
        )}
        {/* Back to Home Button */}
        <div className="mt-6 flex justify-center">
          <Button color="ghost" onClick={onBackToHome}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AttendeeEvents;
