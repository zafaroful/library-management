import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkConstraints() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('Checking constraints on users table...\n');
    
    // Get all constraints on users table
    const constraints = await sql`
      SELECT 
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'public.users'::regclass
      ORDER BY conname;
    `;
    
    console.log('Constraints on users table:');
    constraints.forEach((constraint: any) => {
      console.log(`\n- ${constraint.constraint_name} (${constraint.constraint_type})`);
      console.log(`  ${constraint.constraint_definition}`);
    });
    
    // Check for foreign keys that reference auth.users
    const foreignKeys = await sql`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND (tc.table_name = 'users' OR ccu.table_name = 'auth.users');
    `;
    
    if (foreignKeys.length > 0) {
      console.log('\n\nForeign keys related to users or auth.users:');
      foreignKeys.forEach((fk: any) => {
        console.log(`\n- ${fk.constraint_name}`);
        console.log(`  Table: ${fk.table_name}.${fk.column_name}`);
        console.log(`  References: ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('\n\nNo foreign keys found related to auth.users');
    }
    
  } catch (error) {
    console.error('❌ Error checking constraints:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

checkConstraints().catch(console.error);

