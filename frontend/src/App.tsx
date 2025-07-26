// frontend/src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Link
} from "react-router-dom";
import { Button, Alert } from "react-daisyui";
import EventCreationForm from "./EventCreationForm";
import EventList from "./EventList";
import EventDetails from "./EventDetails";
import InviteAttendee from "./InviteAttendee";
import AttendeeEvents from "./AttendeeEvents";
import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import EditEvent from './EditEvent'; // Import the new EditEvent component
// Define Event interface to match backend and other files
interface Event {
  id: string;
  eventName: string;
  description: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  status?: string;
}

// --- HomePage Component ---
// This component will serve as the main landing page
function HomePage({ activeTab }: { activeTab: string }) {
  const navigate = useNavigate();

  // Helper: get all event dates as strings (YYYY-MM-DD)

  // Helper: get events for a given date string (YYYY-MM-DD)

  // Calendar tileClassName: highlight days with events

  // const selectedEvents = selectedDateStr ? eventsForDate(selectedDateStr) : []; // This variable is not used in HomePage, removed to avoid future linting errors if not needed.

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 sm:p-24 md:p-32">
      {/* Main Content */}
      {activeTab === "organizer" && (
        <>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-8 text-center animate-fade-in-down">
           <span className="text-teal-600">Event Desk</span>
         </h1>
          <p className="max-w-xl text-center text-gray-700 text-lg md:text-xl mb-10 leading-relaxed animate-fade-in-up">
            At <span className="font-bold text-teal-600">Event Desk</span>,
            we’re redefining event planning. Whether it's a birthday, wedding, or
            corporate meetup, we believe everyone deserves a great event
            at an affordable price — <span className="font-semibold">without all the chaos.</span>
            <br />
            <span className="text-base text-gray-600 mt-3 block">
              Your all-in-one solution for seamless event management.
            </span>
          </p>
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <Button
              color="primary"
              size="lg"
              onClick={() => navigate("/create-event")}
            >
              📋 Create an Event
            </Button>
            <Button color="info" size="lg" onClick={() => navigate("/events")}>
              📢 Publish & Share Event
            </Button>
            <Button color="info" size="lg" onClick={() => navigate("/dashboard")}>
              📢 Dashboard
            </Button>
          
          </div>
          {/* Added conditional rendering for loading and error states */}
        </>
      )}
      {activeTab === "participant" && (
        <>
          <div className="max-w-xl text-center text-gray-700 text-lg">
            Welcome, participant! Here you can view your event invitations and
            manage your responses.
          </div>
          <Button
            color="secondary"
            size="lg"
            onClick={() => navigate("/attendee-login")}
          >
            📝 Your Event Responses
          </Button>
        </>
      )}
    </div>
  );
}

// --- Dashboard Page ---
function DashboardPage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<
    "calendar" | "responses" | "participants"
  >("calendar");
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [responseCounts, setResponseCounts] = useState<{
    [key: string]: number;
  }>({});
  const [responseLoading, setResponseLoading] = useState(false);
  const [responseError, setResponseError] = useState("");
  const [participantLoading, setParticipantLoading] = useState(false);
  const [participantError, setParticipantError] = useState("");
  const [participants, setParticipants] = useState<
    { attendeeEmail: string; responseStatus: string }[]
  >([]);
  const [participantStatusFilter, setParticipantStatusFilter] =
    useState<string>("all");

  useEffect(() => {
    setLoading(true);
    
    setError("");
    fetch("/api/events")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch events");
        return res.json();
      })
      .then((data) => setEvents(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Helper: get all event dates as strings (YYYY-MM-DD)
  const eventDates = events.map((ev) => ev.eventDate);
  // Helper: get events for a given date string (YYYY-MM-DD)
  const eventsForDate = (dateStr: string) =>
    events.filter((ev) => ev.eventDate === dateStr);
  // Calendar tileClassName: highlight days with events
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const dateStr = date.toISOString().split("T")[0];
      if (eventDates.includes(dateStr)) {
        return "bg-teal-200 font-bold rounded-full";
      }
    }
    return null;
  };
  // When a date is selected, show events for that date
  const selectedDateStr = selectedDate
    ? selectedDate.toISOString().split("T")[0]
    : null;
  const selectedEvents = selectedDateStr ? eventsForDate(selectedDateStr) : [];

  // Fetch response counters for selected event
  useEffect(() => {
    if (activeMenu === "responses" && selectedEventId) {
      setResponseLoading(true);
     
      setResponseError("");
      fetch(`/api/events/${selectedEventId}/attendees`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch responses");
          return res.json();
        })
        .then((attendees: any[]) => {
          // Count responses by status
          const counts: { [key: string]: number } = {
            Attending: 0,
            "Not Attending": 0,
            Pending: 0,
            Maybe: 0,
          };
          attendees.forEach((a) => {
            if (counts[a.responseStatus] !== undefined) {
              counts[a.responseStatus]++;
            } else {
              counts[a.responseStatus] = 1;
            }
          });
          setResponseCounts(counts);
        })
        .catch((err) => setResponseError(err.message))
        .finally(() => setResponseLoading(false));
    } else {
      setResponseCounts({});
    }
  }, [activeMenu, selectedEventId]);

  // Fetch participants for selected event
  useEffect(() => {
    if (activeMenu === "participants" && selectedEventId) {
      setParticipantLoading(true);
      setParticipantError("");
      fetch(`/api/events/${selectedEventId}/attendees`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch participants");
          return res.json();
        })
        .then((attendees: any[]) => {
          setParticipants(
            attendees.map((a) => ({
              attendeeEmail: a.attendeeEmail,
              responseStatus: a.responseStatus,
            }))
          );
        })
        .catch((err) => setParticipantError(err.message))
        .finally(() => setParticipantLoading(false));
    } else {
      setParticipants([]);
    }
  }, [activeMenu, selectedEventId]);

  // Filtered participants for selected status
  const filteredParticipants =
    participantStatusFilter === "all"
      ? participants
      : participants.filter(
        (p) => p.responseStatus === participantStatusFilter
      );

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-8 flex flex-col gap-4 min-h-screen">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <button
          className="text-left py-2 px-4 rounded bg-gray-700 hover:bg-gray-600 mb-2"
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
        <button
          className={`text-left py-2 px-4 rounded ${activeMenu === "calendar" ? "bg-teal-600" : ""
            }`}
          onClick={() => setActiveMenu("calendar")}
        >
          Event Calendar
        </button>
        <button
          className={`text-left py-2 px-4 rounded ${activeMenu === "responses" ? "bg-teal-600" : ""
            }`}
          onClick={() => setActiveMenu("responses")}
        >
          View Event Responses
        </button>
        <button
          className={`text-left py-2 px-4 rounded ${activeMenu === "participants" ? "bg-teal-600" : ""
            }`}
          onClick={() => setActiveMenu("participants")}
        >
          View Participants
        </button>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {activeMenu === "calendar" && (
          <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-xl mb-8 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 text-center">
              Upcoming Events Calendar
            </h3>
            {loading && (
              <div className="text-center text-gray-500">Loading events...</div>
            )}
            {error && <Alert status="error">{error}</Alert>}
            {!loading && !error && (
              <>
                <Calendar
                  onChange={(date) => setSelectedDate(date as Date)}
                  value={selectedDate}
                  tileClassName={tileClassName}
                  calendarType="iso8601"
                />
                {selectedDateStr && (
                  <div className="mt-6 w-full">
                    <h4 className="font-semibold text-teal-700 mb-2 text-center">
                      Events on {selectedDateStr}
                    </h4>
                    {selectedEvents.length === 0 ? (
                      <div className="text-center text-gray-400">
                        No events on this date.
                      </div>
                    ) : (
                      <ul className="list-disc ml-6">
                        {selectedEvents.map((ev) => (
                          <li key={ev.id} className="mb-1">
                            <span className="font-medium">{ev.eventName}</span>{" "}
                            ({ev.eventStartTime} - {ev.eventEndTime})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {activeMenu === "responses" && (
          <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-xl mb-8 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 text-center">
              Event Response Counters
            </h3>
            {loading && (
              <div className="text-center text-gray-500">Loading events...</div>
            )}
            {error && <Alert status="error">{error}</Alert>}
            {!loading && !error && (
              <>
                <label htmlFor="eventSelect" className="block mb-2 font-medium">
                  Select Event:
                </label>
                <select
                  id="eventSelect"
                  className="mb-6 p-2 border border-gray-300 rounded"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  <option value="">-- Choose an event --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.eventName}
                    </option>
                  ))}
                </select>
                {selectedEventId && (
                  <>
                    {responseLoading && (
                      <div className="text-center text-gray-500">
                        Loading responses...
                      </div>
                    )}
                    {responseError && (
                      <Alert status="error">{responseError}</Alert>
                    )}
                    {!responseLoading && !responseError && (
                      <table className="min-w-full table-auto border mt-4">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-2 border">Accepted</th>
                            <th className="px-4 py-2 border">Rejected</th>
                            <th className="px-4 py-2 border">Pending</th>
                            <th className="px-4 py-2 border">Maybe</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-2 border text-center">
                              {responseCounts["Attending"] || 0}
                            </td>
                            <td className="px-4 py-2 border text-center">
                              {responseCounts["Not Attending"] || 0}
                            </td>
                            <td className="px-4 py-2 border text-center">
                              {responseCounts["Pending"] || 0}
                            </td>
                            <td className="px-4 py-2 border text-center">
                              {responseCounts["Maybe"] || 0}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
        {activeMenu === "participants" && (
          <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-xl mb-8 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 text-center">
              Event Participants
            </h3>
            {loading && (
              <div className="text-center text-gray-500">Loading events...</div>
            )}
            {error && <Alert status="error">{error}</Alert>}
            {!loading && !error && (
              <>
                <label
                  htmlFor="eventSelectParticipants"
                  className="block mb-2 font-medium"
                >
                  Select Event:
                </label>
                <select
                  id="eventSelectParticipants"
                  className="mb-4 p-2 border border-gray-300 rounded"
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    setParticipantStatusFilter("all");
                  }}
                >
                  <option value="">-- Choose an event --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.eventName}
                    </option>
                  ))}
                </select>
                {selectedEventId && (
                  <>
                    <label
                      htmlFor="statusFilter"
                      className="block mb-2 font-medium"
                    >
                      Filter by Response Status:
                    </label>
                    <select
                      id="statusFilter"
                      className="mb-4 p-2 border border-gray-300 rounded"
                      value={participantStatusFilter}
                      onChange={(e) =>
                        setParticipantStatusFilter(e.target.value)
                      }
                    >
                      <option value="all">All</option>
                      <option value="Attending">Accepted</option>
                      <option value="Not Attending">Rejected</option>
                      <option value="Pending">Pending</option>
                      <option value="Maybe">Maybe</option>
                    </select>
                    {participantLoading && (
                      <div className="text-center text-gray-500">
                        Loading participants...
                      </div>
                    )}
                    {participantError && (
                      <Alert status="error">{participantError}</Alert>
                    )}
                    {!participantLoading && !participantError && (
                      <>
                        <table className="min-w-full table-auto border mt-4">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-4 py-2 border">
                                Attendee Email
                              </th>
                              <th className="px-4 py-2 border">Response</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredParticipants.length === 0 ? (
                              <tr>
                                <td colSpan={2} className="text-center py-4">
                                  No participants found.
                                </td>
                              </tr>
                            ) : (
                              filteredParticipants.map((p, idx) => (
                                <tr key={idx}>
                                  <td className="px-4 py-2 border">
                                    {p.attendeeEmail}
                                  </td>
                                  <td className="px-4 py-2 border">
                                    {p.responseStatus}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                        <div className="mt-2 text-gray-700 font-medium">
                          Count: {filteredParticipants.length}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// --- Login Page Component ---
function AttendeeLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Password is not used for actual auth here, but kept for form
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      // Only email is strictly needed for the demo's purpose
      setError("Please enter your email.");
      return;
    }
    // Navigate to AttendeeEvents, passing email as a query parameter
    navigate(`/attendee-events?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Login to View Your Event Responses
        </h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            className="p-2 border border-gray-300 rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            className="p-2 border border-gray-300 rounded-md"
            value={password} // Keep password state, even if not used for auth
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (for demo, any value is fine)"
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Button color="primary" type="submit">
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}

// --- SideMenu Component ---
function SideMenu({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardActive = location.pathname === '/dashboard';
  if(isDashboardActive)
  {
    return (<></>);
  }
  else
  {

  }
  return (
    
    <div className="w-1/4 bg-gray-800 text-white p-8 flex flex-col gap-4 min-h-screen">
  
      <h1 className="text-2xl font-bold mb-6">🎉 Event Desk</h1>
      
      <Button
        className={`text-left ${activeTab === 'organizer' ? 'bg-teal-600' : ''}`}
        onClick={() => { setActiveTab('organizer'); navigate('/'); }}
      >
        Event Organiser
      </Button>
      <Button
        className={`text-left ${activeTab === 'participant' ? 'bg-teal-600' : ''}`}
        onClick={() => { setActiveTab('participant'); navigate('/'); }}
      >
        Event Participant
      </Button>
      
    </div>
  );
}

// --- Home Component ---

// Wrapper for EventList to provide navigation
function EventListWithNav() {
  const navigate = useNavigate();
  return <EventList onBackToHome={() => navigate('/')} />;
}

// Wrapper for EventCreationForm to provide navigation
function EventCreationFormWithNav() {
  const navigate = useNavigate();
  return <EventCreationForm onBackToHome={() => navigate('/')} />;
}

// Wrapper for EventResponder to provide navigation


// --- AttendeeEvents Wrapper to get email from query ---
function AttendeeEventsWithEmail() {
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const email = params.get('email') || ''; // Get email from query parameter

  if (!email) {
    return (
      <div className="text-center p-8">
        <Alert status="error">No email provided. Please go back and provide an email to view your RSVPs.</Alert>
        <Button className="mt-4" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  return <AttendeeEvents initialEmail={email} onBackToHome={() => window.history.back()} />;
}

// --- Update AttendeeEvents to accept initialEmail prop ---
// In AttendeeEvents.tsx, update function signature:
// function AttendeeEvents({ initialEmail = '' }: { initialEmail?: string }) { ... }
// And replace: const [email, setEmail] = useState(initialEmail);

// --- MenuBar Component ---
function MenuBar() {
  return (
    <nav className="w-full bg-gray-800 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="font-bold text-xl">Event Desk</div>
      <div className="flex gap-4">
        <Link to="/" className="hover:text-teal-300">Home</Link>
        <Link to="/dashboard" className="hover:text-teal-300">View Dashboard</Link>
        {/*<Link to="/create-event" className="hover:text-teal-300">Create Event</Link>
        <Link to="/events" className="hover:text-teal-300">Events</Link>
        <Link to="/attendee-login" className="hover:text-teal-300">Attendee Login</Link>*/}
      </div>
    </nav>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('organizer');

  return (
    <Router>
      <div className="flex min-h-screen w-full bg-gray-50">
      <SideMenu activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1">
          <MenuBar />
          <Routes>
            <Route path="/" element={<HomePage activeTab={activeTab} />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/create-event" element={<EventCreationFormWithNav />} />
            <Route path="/events" element={<EventListWithNav />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="/edit-event/:id" element={<EditEvent />} /> {/* New route for editing events */}
            {/* Route for inviting attendees to an event */}
            <Route path="/invite/:eventId" element={<InviteAttendee />} />
            <Route path="/attendee-login" element={<AttendeeLogin />} />
            <Route path="/attendee-events" element={<AttendeeEventsWithEmail />} />
          
        </Routes>
      </div>
    </div>
    </Router >
  );
}

export default App;
