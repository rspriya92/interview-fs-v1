// filepath: d:\Priya\javascript testing\interview-fs-v1\frontend\src\EventDetails.tsx
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Event {
  id: string;
  eventName: string;
  description: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  status?: string;
}

function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(res => res.json())
      .then(setEvent);
  }, [id]);

  if (!event) return <div>Loading...</div>;

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">{event.eventName}</h2>
      <p><strong>Description:</strong> {event.description}</p>
      <p><strong>Date:</strong> {event.eventDate}</p>
      <p><strong>Start Time:</strong> {event.eventStartTime}</p>
      <p><strong>End Time:</strong> {event.eventEndTime}</p>
      <p><strong>Status:</strong> {event.status || 'draft'}</p>
    </div>
  );
}

export default EventDetails;