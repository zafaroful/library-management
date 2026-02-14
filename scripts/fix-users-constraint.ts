import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixUsersConstraint() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('Fixing users table foreign key constraint...');
    
    // Drop the foreign key constraint if it exists
    await sql`
      ALTER TABLE public.users 
      DROP CONSTRAINT IF EXISTS users_user_id_fkey;
    `;
    
    // Ensure user_id has a default value
    await sql`
      ALTER TABLE public.users 
      ALTER COLUMN user_id SET DEFAULT uuid_generate_v4();
    `;
    
    // Make sure password_hash is NOT NULL (if it isn't already)
    // First check if there are any NULL values
    const nullPasswordHash = await sql`
      SELECT COUNT(*) as count 
      FROM public.users 
      WHERE password_hash IS NULL;
    `;
    
    if (nullPasswordHash[0].count > 0) {
      console.warn(`Warning: Found ${nullPasswordHash[0].count} users with NULL password_hash. These need to be handled.`);
    } else {
      await sql`
        ALTER TABLE public.users 
        ALTER COLUMN password_hash SET NOT NULL;
      `;
    }
    
    console.log('✅ Users table foreign key constraint fixed!');
  } catch (error) {
    console.error('❌ Error fixing users constraint:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

fixUsersConstraint().catch(console.error);

