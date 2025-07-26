// frontend/src/EditEvent.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Alert, Loading } from 'react-daisyui'; // Import Button, Alert, and Loading

// Define the Event interface for type safety
interface Event {
    id: string;
    eventName: string;
    description: string;
    eventDate: string;
    eventStartTime: string;
    eventEndTime: string;
    status?: string; // status is optional
}

const EditEvent = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    // Initialize event state with Event type or null
    const [event, setEvent] = useState<Event | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) { // Handle case where id might be undefined
                setError('Event ID is missing.');
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`/api/events/${id}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch event');
                }
                const data: Event = await response.json();
                setEvent(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id]); // Depend on id to refetch if it changes

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Ensure event is not null before updating
        if (event) {
            setEvent({ ...event, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !event) { // Ensure id and event data exist
            setError('Cannot update: Event data or ID is missing.');
            return;
        }
        try {
            const response = await fetch(`/api/events/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update event');
            }
            navigate('/events'); // Redirect to events list after editing
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loading size="lg" />
                <p className="ml-2 text-gray-600">Loading event details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Alert status="error" className="max-w-md">
                    Error: {error}
                </Alert>
            </div>
        );
    }

    // Only render the form if event data is available
    if (!event) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Alert status="info" className="max-w-md">
                    No event data found.
                </Alert>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Edit Event</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="form-control w-full">
                    <span className="label-text mb-1">Event Name:</span>
                    <input
                        type="text"
                        name="eventName"
                        value={event.eventName}
                        onChange={handleChange}
                        placeholder="Event Name"
                        className="input input-bordered w-full rounded-md p-2 border border-gray-300"
                        required
                    />
                </label>
                <label className="form-control w-full">
                    <span className="label-text mb-1">Description:</span>
                    <textarea
                        name="description"
                        value={event.description}
                        onChange={(e) => setEvent({ ...event, description: e.target.value })} // Use textarea for description
                        placeholder="Description"
                        className="textarea textarea-bordered h-24 w-full rounded-md p-2 border border-gray-300"
                        required
                    ></textarea>
                </label>
                <label className="form-control w-full">
                    <span className="label-text mb-1">Event Date:</span>
                    <input
                        type="date"
                        name="eventDate"
                        value={event.eventDate}
                        onChange={handleChange}
                        className="input input-bordered w-full rounded-md p-2 border border-gray-300"
                        required
                    />
                </label>
                <label className="form-control w-full">
                    <span className="label-text mb-1">Start Time:</span>
                    <input
                        type="time"
                        name="eventStartTime"
                        value={event.eventStartTime}
                        onChange={handleChange}
                        className="input input-bordered w-full rounded-md p-2 border border-gray-300"
                        required
                    />
                </label>
                <label className="form-control w-full">
                    <span className="label-text mb-1">End Time:</span>
                    <input
                        type="time"
                        name="eventEndTime"
                        value={event.eventEndTime}
                        onChange={handleChange}
                        className="input input-bordered w-full rounded-md p-2 border border-gray-300"
                        required
                    />
                </label>
                <Button type="submit" color="primary" className="mt-4 w-full">
                    Save Changes
                </Button>
                <Button type="button" color="ghost" className="w-full" onClick={() => navigate('/events')}>
                    Cancel
                </Button>
            </form>
        </div>
    );
};

export default EditEvent;