import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    // Read the functions SQL file
    const functionsSql = fs.readFileSync(
      path.join(__dirname, '../lib/db/functions.sql'),
      'utf-8'
    );

    console.log('Running database functions and triggers...');
    
    // Execute the SQL
    await sql.unsafe(functionsSql);
    
    console.log('✅ Database functions and triggers set up successfully!');
  } catch (error) {
    console.error('❌ Error setting up database functions:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

setupDatabase().catch(console.error);

