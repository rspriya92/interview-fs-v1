// init_and_alter_db.ts

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url'; // Required for __dirname in ES module scope

// Get __dirname equivalent in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to your database file.
// This assumes 'event.db' is in the same directory as this script after compilation,
// or one level up if this script is in a 'dist' folder (e.g., for 'backend/dist/init_and_alter_db.js').
// Adjust as per your project structure. For typical backend setup, 'event.db' in backend root:
//const dbPath = path.join(__dirname, '..', 'event.db'); // Assumes event.db is in the parent directory of the compiled script

let db: Database.Database | null = null;
db = new Database("event.db");

try {
  // Open the database connection. If the file doesn't exist, it will be created.
  

  // Optional: Enable verbose mode for debugging to see SQL statements executed
  // db.verbose();

  console.log('Attempting to create/ensure "events" table with latest schema...');

  // Create the 'events' table if it doesn't already exist.
  // This CREATE TABLE statement includes all desired columns in their final state.
  db.prepare(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creatorEmail TEXT NOT NULL,
      eventName TEXT NOT NULL,
      description TEXT,
      targetedAttendees INTEGER NOT NULL,
      eventDate TEXT,
      eventStartTime TEXT,
      eventEndTime TEXT,
      eventDuration TEXT,
      status TEXT NOT NULL DEFAULT 'Created',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      attendingCount INTEGER DEFAULT 0,    -- New column for RSVP counter
      notAttendingCount INTEGER DEFAULT 0, -- New column for RSVP counter
      maybeCount INTEGER DEFAULT 0,        -- New column for RSVP counter
      pendingCount INTEGER DEFAULT 0,      -- New column for RSVP counter
      CHECK (status IN ('Created', 'Published', 'Archived', 'Cancelled'))
    )
  `).run();

  console.log('✅ "events" table created/ensured successfully with base schema.');

  // --- Helper function to add columns if they don't exist ---
  const addColumn = (tableName: string, columnName: string, columnType: string, defaultValue: any = null) => {
      try {
          // Check if column exists
          const columnInfo = db!.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
          const columnExists = columnInfo.some(col => col.name === columnName);

          if (!columnExists) {
              db!.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType} DEFAULT ${defaultValue}`).run();
              console.log(`✅ Added column '${columnName}' to table '${tableName}'.`);
          } else {
              console.log(`ℹ️ Column '${columnName}' already exists in table '${tableName}'. Skipping.`);
          }
      } catch (e: any) {
          console.error(`❌ Error adding column '${columnName}' to table '${tableName}': ${e.message}`);
      }
  };

  // --- ALTER TABLE statements for existing databases (graceful upgrades) ---

  // 1. Rename 'eventTime' to 'eventStartTime' (if 'eventTime' existed and 'eventStartTime' doesn't)
  try {
    const columnExists = db.prepare("PRAGMA table_info(events)").all()
                            .some((col: any) => col.name === 'eventTime');
    const newColumnExists = db.prepare("PRAGMA table_info(events)").all()
                              .some((col: any) => col.name === 'eventStartTime');

    if (columnExists && !newColumnExists) {
      db.prepare('ALTER TABLE events RENAME COLUMN eventTime TO eventStartTime').run();
      console.log('✅ Column "eventTime" renamed to "eventStartTime".');
    } else if (columnExists && newColumnExists) {
      console.warn('⚠️ Both "eventTime" and "eventStartTime" columns exist. Skipping rename.');
    } else {
      console.log('ℹ️ "eventTime" column does not exist, no rename needed.');
    }
  } catch (err: any) {
    console.error(`❌ Error during "eventTime" to "eventStartTime" rename: ${err.message}`);
    // Do not exit, try to continue with other alterations
  }

  // 2. Add 'eventEndTime' column
  addColumn('events', 'eventEndTime', 'TEXT', "''"); // Default to empty string
  // 3. Add 'eventDuration' column
  addColumn('events', 'eventDuration', 'TEXT', "''"); // Default to empty string
  // 4. Add 'status' column
  addColumn('events', 'status', 'TEXT NOT NULL', "'Created'");

  // 5. Add RSVP counter columns
  addColumn('events', 'attendingCount', 'INTEGER', 0);
  addColumn('events', 'notAttendingCount', 'INTEGER', 0);
  addColumn('events', 'maybeCount', 'INTEGER', 0);
  addColumn('events', 'pendingCount', 'INTEGER', 0);


  console.log('✅ Database initialization and alteration script completed.');

} catch (error: any) {
  console.error(`❌ Critical error during database operation: ${error.message}`);
  process.exit(1); // Exit if a critical, unhandled error occurs
} finally {
  // Always close the database connection
  if (db) {
    db.close();
    console.log('Database connection closed.');
  }
}
