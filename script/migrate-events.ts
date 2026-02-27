import "dotenv/config";
import { pool } from "../server/db";

async function main() {
  const sql = `
  BEGIN;
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'events' AND column_name = 'date'
    ) THEN
      ALTER TABLE events RENAME COLUMN "date" TO start_date_time;
    END IF;
  END $$;

  ALTER TABLE events
    ADD COLUMN IF NOT EXISTS end_date_time TIMESTAMP,
    ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'Main Campus',
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS publish_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

  UPDATE events SET location = 'Main Campus'
  WHERE location IS NULL;

  UPDATE events SET category = COALESCE(category, 'General');

  CREATE TABLE IF NOT EXISTS event_images (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'upload',
    file_path TEXT,
    caption TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
  );

  COMMIT;
  `;

  await pool.query(sql);
  console.log("Event schema migration complete.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  pool.end().catch(() => {});
  process.exit(1);
});
