import { useParams, useLocation } from 'react-router-dom'; // Import useLocation
import { useState, useEffect } from 'react';
import { Button, Alert, Loading } from 'react-daisyui';

interface Event {
  id: string;
  eventName: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  description: string;
}

// Define interface for attendee response from backend
interface AttendeeResponse {
    id: number;
    eventId: number;
    attendeeEmail: string;
    responseStatus: 'Pending' | 'Attending' | 'Not Attending' | 'Maybe';
    notes: string | null;
    rsvpDate: string;
}

function InviteAttendee() {
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation(); // Get location object to access state
  
  // Initialize attendeeEmail from location state if available, otherwise empty
  const initialAttendeeEmail = (location.state as { attendeeEmail?: string })?.attendeeEmail || '';

  const [event, setEvent] = useState<Event | null>(null);
  const [attendeeEmail, setAttendeeEmail] = useState(initialAttendeeEmail);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'success' | 'error' | 'info' | ''>(''); // Status for Alert component
  const [loading, setLoading] = useState(false);
  const [existingResponseStatus, setExistingResponseStatus] = useState<'Attending' | 'Not Attending' | 'Maybe' | 'Pending' | ''>(''); // To highlight buttons

  useEffect(() => {
    const fetchEventAndAttendeeResponse = async () => {
      setLoading(true);
      setInviteMessage('');
      setInviteStatus('');

      try {
        // Fetch event details
        const eventRes = await fetch(`/api/events/${eventId}`);
        if (!eventRes.ok) {
          throw new Error(`Failed to fetch event details: ${eventRes.statusText}`);
        }
        const eventData: Event = await eventRes.json();
        setEvent(eventData);

        // If an initial email is provided (meaning it's an "Edit Response" flow),
        // fetch the existing attendee response for this event and email.
        if (initialAttendeeEmail) {
          // Fetch all attendees for the event and filter on frontend
          // (Backend doesn't have a direct endpoint for eventId + email)
          const attendeesRes = await fetch(`/api/events/${eventId}/attendees`);
          if (!attendeesRes.ok) {
            throw new Error(`Failed to fetch attendees: ${attendeesRes.statusText}`);
          }
          const attendees: AttendeeResponse[] = await attendeesRes.json();
          
          const foundAttendee = attendees.find(
            (att) => att.attendeeEmail.toLowerCase() === initialAttendeeEmail.toLowerCase()
          );

          if (foundAttendee) {
            setExistingResponseStatus(foundAttendee.responseStatus);
            setInviteMessage(`Your current response is: ${foundAttendee.responseStatus}`);
            setInviteStatus('success');
          } else {
            setExistingResponseStatus(''); // No existing response found for this email
            setInviteMessage('No prior RSVP found for this email. Please submit your response.');
            setInviteStatus('info'); // Use info for "no prior response"
          }
        }

      } catch (err: any) {
        setInviteMessage('Error loading event or your existing response: ' + err.message);
        setInviteStatus('error');
        setEvent(null); // Clear event if there's an error
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventAndAttendeeResponse();
    }
  }, [eventId, initialAttendeeEmail]); // Depend on eventId and initialAttendeeEmail

  const handleSendInvite = async (status: 'Attending' | 'Not Attending' | 'Maybe') => {
    setInviteMessage('');
    setInviteStatus('');
    if (!attendeeEmail.trim()) {
      setInviteMessage('Please enter attendee email.');
      setInviteStatus('error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) {
      setInviteMessage('Please enter a valid email address.');
      setInviteStatus('error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/attendees`, {
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
      setExistingResponseStatus(status); // Update existing status on successful submission
      setInviteMessage(`RSVP sent successfully: ${status}`);
      setInviteStatus('success');
    } catch (err: any) {
      setInviteMessage('Failed to send RSVP: ' + err.message);
      setInviteStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !event) { // Only show full loading if event is not yet loaded
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" /> <span className="ml-2">Loading event...</span>
      </div>
    );
  }

  if (!event) { // If event failed to load
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        <Alert status="error">Event not found or an error occurred.</Alert>
      </div>
    );
  }

  // Helper function to determine button class
  const getButtonClass = (buttonStatus: 'Attending' | 'Not Attending' | 'Maybe') => {
    const baseClasses = 'w-1/3 py-2 px-4 rounded-md font-semibold transition-all duration-200';
    if (existingResponseStatus === buttonStatus) {
      // Highlight selected status
      if (buttonStatus === 'Attending') return `${baseClasses} bg-green-600 text-white shadow-lg`;
      if (buttonStatus === 'Not Attending') return `${baseClasses} bg-red-600 text-white shadow-lg`;
      if (buttonStatus === 'Maybe') return `${baseClasses} bg-yellow-500 text-white shadow-lg`;
    }
    // Default styles for unselected buttons
    if (buttonStatus === 'Attending') return `${baseClasses} bg-green-100 text-green-700 hover:bg-green-200`;
    if (buttonStatus === 'Not Attending') return `${baseClasses} bg-red-100 text-red-700 hover:bg-red-200`;
    if (buttonStatus === 'Maybe') return `${baseClasses} bg-yellow-100 text-yellow-700 hover:bg-yellow-200`;
    return baseClasses; // Fallback
  };


  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-xl bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4">RSVP for: {event.eventName}</h2>
        <p className="mb-2"><strong>Date:</strong> {event.eventDate}</p>
        <p className="mb-2"><strong>Start Time:</strong> {event.eventStartTime}</p>
        <p className="mb-2"><strong>End Time:</strong> {event.eventEndTime}</p>
        <p className="mb-2"><strong>Description:</strong> {event.description}</p>
        
        <div className="mb-4 mt-6">
          <label htmlFor="attendeeEmail" className="block font-medium mb-2 text-gray-700">Your Email:</label>
          <input
            type="email"
            id="attendeeEmail"
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none cursor-not-allowed"
            value={attendeeEmail}
            onChange={(e) => setAttendeeEmail(e.target.value)} // Still allow changing if not pre-populated
            placeholder="your.email@example.com"
            disabled={initialAttendeeEmail !== ''} // Disable if email was pre-populated
            required
          />
        </div>

        <div className="flex gap-4 mb-4">
          <Button className={getButtonClass('Attending')} onClick={() => handleSendInvite('Attending')} disabled={loading}>
            Yes, Attending
          </Button>
          <Button className={getButtonClass('Not Attending')} onClick={() => handleSendInvite('Not Attending')} disabled={loading}>
            No, Not Attending
          </Button>
          <Button className={getButtonClass('Maybe')} onClick={() => handleSendInvite('Maybe')} disabled={loading}>
            Maybe
          </Button>
        </div>
        {loading && <Loading size="sm" className="mt-2" />}
        {inviteMessage && inviteStatus && <Alert status={inviteStatus as 'success' | 'error' | 'info' | 'warning' | undefined} className="mt-4">{inviteMessage}</Alert>}
      </div>
    </div>
  );
}

export default InviteAttendee;
