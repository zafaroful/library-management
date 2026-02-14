/**
 * One-off script: add cover_image_url (and other missing book columns) to the books table.
 * Run with: pnpm exec tsx scripts/add-cover-image-column.ts
 */
import * as dotenv from "dotenv";
import postgres from "postgres";

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  try {
    // Add missing columns to match schema (PostgreSQL 9.5+ ADD COLUMN IF NOT EXISTS)
    await sql.unsafe(`
      ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_image_url text;
      ALTER TABLE books ADD COLUMN IF NOT EXISTS description text;
      ALTER TABLE books ADD COLUMN IF NOT EXISTS pages integer;
      ALTER TABLE books ADD COLUMN IF NOT EXISTS publication_year integer;
    `);
    console.log("Columns cover_image_url, description, pages, publication_year added (or already exist).");
  } catch (err) {
    console.error("Error adding column:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
