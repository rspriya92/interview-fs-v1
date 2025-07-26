// backend/server.ts (or app.ts)

// Import necessary modules using ES module syntax for TypeScript

import express from "express";

import Database from "better-sqlite3";

//import cors from 'cors'; // For handling Cross-Origin Resource Sharing

import path from "path"; // For resolving database file path

import { fileURLToPath } from "url"; //

import messageRouter from "./routes/message.js"; // Adjust path/extension as needed

import { createAttendeesRouter } from "./routes/attendees.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

// If you were using UUIDs for IDs (not needed with AUTOINCREMENT):

// import { v4 as uuidv4 } from 'uuid';

// Initialize Express app

const app = express();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000; // Use environment variable or default to 5000

// --- Middleware ---

// Enable CORS for all origins (for development purposes)

// In production, you should restrict this to your frontend's domain.

//app.use(cors());

// Parse JSON request bodies

app.use(express.json());

// --- Database Setup ---

// Ensure the database file is in the correct location.

// __dirname refers to the directory where the currently executing script is located.

//const dbPath = path.join(__dirname, 'event.db');

let db: Database.Database; // Explicitly type 'db' as a better-sqlite3 Database instance

db = new Database("event.db");

try {
  console.log(`✅ Connected to SQLite database: ${db.name}`);

  // Create the events table if it doesn't exist

  // IMPORTANT: This schema must match your `init-db.ts` file exactly

  // `id INTEGER PRIMARY KEY AUTOINCREMENT` means SQLite generates the ID.

  // `targetedAttendees INTEGER NOT NULL` matches frontend's parseInt().

  // `submissionMessage` and `isSubmitting` are removed as they are frontend UI state.

  db.prepare(
    `

 CREATE TABLE IF NOT EXISTS events (

 id INTEGER PRIMARY KEY AUTOINCREMENT,

 creatorEmail TEXT NOT NULL,

 eventName TEXT NOT NULL,

 description TEXT,

 targetedAttendees INTEGER NOT NULL, -- Changed to INTEGER as per API

 eventDate TEXT,

 eventStartTime TEXT,    -- Directly named as eventStartTime

 eventEndTime TEXT,     -- New column

 eventDuration TEXT,    -- New column

 status TEXT NOT NULL DEFAULT 'Created', -- New column with default and NOT NULL

 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

 CHECK (status IN ('Created', 'Published', 'Archived', 'Cancelled')) -- Added CHECK constraint

 )

`
  ).run();

  console.log('✅ "events" table ensured to exist.');
} catch (err: any) {
  // Type 'err' as 'any' for simplicity, or 'unknown' and narrow it

  console.error(
    "❌ Error connecting to or initializing database:",
    err.message
  );

  process.exit(1); // Exit if database connection fails
}

// --- Define an interface for the expected request body for /api/create-event ---

interface CreateEventRequestBody {
  creatorEmail: string;

  eventName: string;

  description: string;

  targetedAttendees: number;

  eventDate: string;

  eventStartTime: string;

  eventEndTime: string; // <-- Added eventEndTime here
}

// --- API Endpoints ---

app.use("/api", messageRouter);

app.use("/api", createAttendeesRouter(db));

// Remove the old app.get('/api/message', ...) from this file

// 2. POST /api/create-event - Endpoint to receive and save new event data

// Use the defined interface for req.body for type safety

app.post(
  "/api/create-event",
  (
    req: express.Request<{}, {}, CreateEventRequestBody>,
    res: express.Response
  ) => {
    // Destructure only the relevant event data fields from the request body

    const {
      creatorEmail,
      eventName,
      description,
      targetedAttendees,
      eventDate,
      eventStartTime,
      eventEndTime,
    } = req.body;

    // --- Server-side Validation ---

    // Check for missing required fields (use targetedAttendees !== undefined for number type)

    if (
      !creatorEmail ||
      !eventName ||
      !description ||
      targetedAttendees === undefined ||
      !eventDate ||
      !eventStartTime ||
      !eventEndTime
    ) {
      return res
        .status(400)
        .json({
          error: "Missing required event fields. All fields are mandatory.",
        });
    }

    // Basic type validation

    if (
      typeof creatorEmail !== "string" ||
      typeof eventName !== "string" ||
      typeof description !== "string" ||
      typeof eventDate !== "string" ||
      typeof eventStartTime !== "string" ||
      typeof eventEndTime !== "string"
    ) {
      return res
        .status(400)
        .json({ error: "Invalid data types for one or more string fields." });
    }

    // Ensure targetedAttendees is a positive integer

    if (
      typeof targetedAttendees !== "number" ||
      targetedAttendees <= 0 ||
      !Number.isInteger(targetedAttendees)
    ) {
      return res
        .status(400)
        .json({ error: "Targeted Attendees must be a positive integer." });
    }

    try {
      // Prepare the INSERT statement.

      // 'id' column is omitted as it's AUTOINCREMENT.

      const insertStmt = db.prepare(`

   INSERT INTO events (creatorEmail, eventName, description, targetedAttendees, eventDate, eventStartTime, eventEndTime)

   VALUES (?, ?, ?, ?, ?, ?, ?)

  `);

      // Run the statement with the extracted data

      const info = insertStmt.run(
        creatorEmail,

        eventName,

        description,

        targetedAttendees,

        eventDate,

        eventStartTime,

        eventEndTime
      );

      // info.lastInsertRowid contains the ID generated by AUTOINCREMENT

      console.log(
        `Event created: ID=${info.lastInsertRowid}, Changes=${info.changes}`
      );

      res.status(201).json({
        message: "Event created successfully!",

        eventId: info.lastInsertRowid, // Send the generated ID back to the frontend

        changes: info.changes,
      });
    } catch (error: any) {
      // Type 'error' as 'any'

      console.error("❌ Database insert error:", error.message);

      // More specific error handling could be added here (e.g., duplicate entry, schema mismatch)

      res
        .status(500)
        .json({
          error: "Failed to save event to database.",
          details: error.message,
        });
    }
  }
);

// 3. GET /api/events - Endpoint to retrieve all events

app.get("/api/events", (_req: express.Request, res: express.Response) => {
  try {
    // Use .all() to get all rows

    const events = db.prepare("SELECT * FROM events").all();

    res.status(200).json(events);
  } catch (error: any) {
    // Type 'error' as 'any'

    console.error("❌ Database fetch error:", error.message);

    res
      .status(500)
      .json({ error: "Failed to retrieve events.", details: error.message });
  }
});

app.put("/api/events/:id/publish", (req, res) => {
  const eventId = req.params.id;

  try {
    // Update the status to 'Published' for the given event ID in SQLite

    const stmt = db.prepare("UPDATE events SET status = ? WHERE id = ?");

    const info = stmt.run("Published", eventId);

    if (info.changes === 0) {
      return res.status(404).send("Event not found");
    }

    res.json({ success: true, message: "Event published" });
  } catch (err: any) {
    console.error("Publish error:", err.message);

    res.status(500).send("Server error");
  }
});

app.put("/api/events/:id/cancel", (req, res) => {
  const eventId = req.params.id;

  try {
    const stmt = db.prepare("UPDATE events SET status = ? WHERE id = ?");

    const info = stmt.run("Cancelled", eventId);

    if (info.changes === 0) {
      return res.status(404).send("Event not found");
    }

    res.json({ success: true, message: "Event cancelled" });
  } catch (err: any) {
    res.status(500).send("Server error");
  }
});

app.get("/api/events/:id", (req, res) => {
  const eventId = req.params.id;

  try {
    const stmt = db.prepare("SELECT * FROM events WHERE id = ?");

    const event = stmt.get(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch event", details: err.message });
  }
});

// --- Start the Server ---

app.listen(PORT, () => {
  console.log(
    `🚀 Node.js backend server listening on http://localhost:${PORT}`
  );

  console.log(`API endpoints:`);

  console.log(` GET http://localhost:${PORT}/api/message`);

  console.log(` POST http://localhost:${PORT}/api/create-event`);

  console.log(` GET http://localhost:${PORT}/api/events`);
});

// Close database connection on process exit (important for SQLite)

process.on("exit", () => {
  if (db) {
    db.close();

    console.log("Database connection closed.");
  }
});

// Handle Ctrl+C (SIGINT) to ensure graceful shutdown and DB close

process.on("SIGINT", () => {
  process.exit();
});

// Catch any unhandled exceptions to prevent process crash

process.on("uncaughtException", (err: any) => {
  // Type 'err' as 'any'

  console.error("Uncaught Exception:", err);

  process.exit(1);
});
