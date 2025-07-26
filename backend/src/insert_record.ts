// insert-event.ts
import Database from 'better-sqlite3';

// Path to your database file
const dbPath = 'event.db';

const db = new Database(dbPath);

try {
  // Open the database connection
  
  // Optional: Set verbose mode for debugging to see SQL statements
  // db.verbose();

  // Prepare the INSERT statement
  // Using placeholders (?) for values is crucial for security and correctness
  const insertStmt = db.prepare(`
    INSERT INTO events (
      creatorEmail,
      eventName,
      description,
      targetedAttendees,
      eventDate,
      eventStartTime
      -- submissionMessage and isSubmitting are typically UI-related and not stored here
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Define the data for the new event
  const newEventData = {
    creatorEmail: 'test.user@example.com',
    eventName: 'Sample Tech Meetup',
    description: 'A casual meetup for local tech enthusiasts.',
    targetedAttendees: 50,
    eventDate: '2025-08-15',
    eventStartTime: '18:00',
  };

  // Run the insert statement with the data
  const info = insertStmt.run(
    newEventData.creatorEmail,
    newEventData.eventName,
    newEventData.description,
    newEventData.targetedAttendees,
    newEventData.eventDate,
    newEventData.eventStartTime
  );

  console.log(`✅ Successfully inserted 1 row into 'events' table.`);
  console.log(`Last inserted row ID: ${info.lastInsertRowid}`);
  console.log(`Changes made: ${info.changes}`);

} catch (error) {
  console.error(`❌ Error inserting data: ${error}`);
} finally {
  // Always close the database connection
  if (db) {
    db.close();
    console.log('Database connection closed.');
  }
}
