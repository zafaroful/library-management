import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function forceDropUsersFkey() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('Force dropping users_user_id_fkey constraint...\n');
    
    // Try to drop it directly, even if we can't see it
    try {
      await sql.unsafe(`
        ALTER TABLE public.users 
        DROP CONSTRAINT IF EXISTS users_user_id_fkey CASCADE;
      `);
      console.log('✅ Attempted to drop users_user_id_fkey (CASCADE)');
    } catch (err: any) {
      if (err.code === '42704') {
        console.log('ℹ️  Constraint does not exist (expected)');
      } else {
        console.error('⚠️  Error:', err.message);
      }
    }
    
    // Also try without CASCADE
    try {
      await sql.unsafe(`
        ALTER TABLE public.users 
        DROP CONSTRAINT IF EXISTS users_user_id_fkey;
      `);
      console.log('✅ Attempted to drop users_user_id_fkey');
    } catch (err: any) {
      if (err.code === '42704') {
        console.log('ℹ️  Constraint does not exist (expected)');
      } else {
        console.error('⚠️  Error:', err.message);
      }
    }
    
    // Check all constraints one more time
    console.log('\n\nFinal check - all constraints on users table:');
    const allConstraints = await sql`
      SELECT 
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'public.users'::regclass
      ORDER BY conname;
    `;
    
    if (allConstraints.length > 0) {
      console.log(`Found ${allConstraints.length} constraint(s):`);
      allConstraints.forEach((constraint: any) => {
        console.log(`  - ${constraint.constraint_name} (${constraint.constraint_type})`);
      });
    } else {
      console.log('No constraints found');
    }
    
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

forceDropUsersFkey().catch(console.error);

