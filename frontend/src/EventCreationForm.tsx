// frontend/src/EventCreationForm.jsx (or .tsx)
import { useState } from 'react';
import { Button, Input, Textarea, Alert } from 'react-daisyui';

interface EventCreationFormProps {
  onBackToHome: () => void;
}

function EventCreationForm({ onBackToHome }: EventCreationFormProps) {
  const [creatorEmail, setCreatorEmail] = useState('');
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [targetedAttendees, setTargetedAttendees] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, seteventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionMessage('');

    if (!creatorEmail || !eventName || !description || !targetedAttendees || !eventDate || !eventStartTime || !eventEndTime) {
      setSubmissionMessage('error|Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }
    if (parseInt(targetedAttendees) <= 0) {
        setSubmissionMessage('error|Targeted Attendees must be a positive number.');
        setIsSubmitting(false);
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(creatorEmail)) {
      setSubmissionMessage('error|Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    const eventData = {
      creatorEmail,
      eventName,
      description,
      targetedAttendees: parseInt(targetedAttendees),
      eventDate,
      eventStartTime,
      eventEndTime,
    };

    try {
      const response = await fetch('/api/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      setSubmissionMessage(`success|Event "${eventName}" created successfully! Event ID: ${result.eventId || 'N/A'}`);
      setCreatorEmail('');
      setEventName('');
      setDescription('');
      setTargetedAttendees('');
      setEventDate('');
      seteventStartTime('');
      setEventEndTime('');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setSubmissionMessage(`error|Failed to create event: ${errorMsg}`);
      console.error('Event creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="w-full max-w-2xl bg-white p-8 md:p-10 rounded-xl shadow-lg border border-emerald-100 transform hover:scale-[1.005] transition-all duration-300 ease-in-out">
        <h2 className="text-3xl md:text-4xl font-extrabold text-emerald-800 mb-6 text-center tracking-tight leading-tight">
            <span className="text-blue-600">Create Your</span> Event
        </h2>

        {submissionMessage && (
            <Alert
                status={submissionMessage.startsWith('success') ? 'success' : 'error'}
                className={`mb-4 ${submissionMessage.startsWith('success') ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-red-50 border-red-300 text-red-700'} p-3 rounded-md`}
            >
                {submissionMessage.split('|')[1]}
            </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="creatorEmail" className="block text-sm font-bold text-black mb-1">Event Creator Email:</label> {/* Changed text-emerald-700 to text-black */}
                <Input
                    type="email"
                    id="creatorEmail"
                    value={creatorEmail}
                    onChange={(e) => setCreatorEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full bg-emerald-50 text-black border-emerald-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md shadow-sm transition-all duration-200 placeholder-gray-500"
                    required
                />
            </div>

            <div>
                <label htmlFor="eventName" className="block text-sm font-bold text-black mb-1">Event Name:</label> {/* Changed text-emerald-700 to text-black */}
                <Input
                    type="text"
                    id="eventName"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g., Annual Tech Conference"
                    className="w-full bg-emerald-50 text-black border-emerald-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md shadow-sm transition-all duration-200 placeholder-gray-500"
                    required
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-bold text-black mb-1">Description:</label> {/* Changed text-emerald-700 to text-black */}
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief description of your event..."
                    className="w-full h-32 bg-emerald-50 text-black border-emerald-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md shadow-sm transition-all duration-200 placeholder-gray-500"
                    required
                />
            </div>

            <div>
                <label htmlFor="targetedAttendees" className="block text-sm font-bold text-black mb-1">Targeted Attendees:</label> {/* Changed text-emerald-700 to text-black */}
                <Input
                    type="number"
                    id="targetedAttendees"
                    value={targetedAttendees}
                    onChange={(e) => setTargetedAttendees(e.target.value)}
                    placeholder="e.g., 100"
                    className="w-full bg-emerald-50 text-black border-emerald-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md shadow-sm transition-all duration-200 placeholder-gray-500"
                    min="1"
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="eventDate" className="block text-sm font-bold text-black mb-1">Event Date:</label> {/* Changed text-emerald-700 to text-black */}
                    <Input
                        type="date"
                        id="eventDate"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full bg-emerald-50 text-black border-emerald-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md shadow-sm transition-all duration-200"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="eventStartTime" className="block text-sm font-bold text-black mb-1">Event Start Time:</label> {/* Changed text-emerald-700 to text-black */}
                    <Input
                        type="time"
                        id="eventStartTime"
                        value={eventStartTime}
                        onChange={(e) => seteventStartTime(e.target.value)}
                        className="w-full bg-emerald-50 text-black border-emerald-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md shadow-sm transition-all duration-200"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="eventEndTime" className="block text-sm font-bold text-black mb-1">Event End Time:</label> {/* Changed text-emerald-700 to text-black */}
                    <Input
                        type="time"
                        id="eventEndTime"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="w-full bg-emerald-50 text-black border-emerald-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md shadow-sm transition-all duration-200"
                        required
                    />
                </div>
            </div>

            <div className="flex justify-between gap-4 mt-8">
                <Button
                    type="button"
                    color="ghost"
                    onClick={onBackToHome}
                    className="flex-grow bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Back to Home
                </Button>
                <Button
                    type="submit"
                    color="primary"
                    className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creating Event...' : 'Create Event'}
                </Button>
            </div>
        </form>
    </div>
);
 
}

export default EventCreationForm; // Export the component