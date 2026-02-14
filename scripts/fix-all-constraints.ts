import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixAllConstraints() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('Checking and fixing all constraints...\n');
    
    // Get all foreign key constraints that might reference auth.users
    const allConstraints = await sql`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_schema AS foreign_schema,
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
        AND (ccu.table_schema = 'auth' OR ccu.table_name = 'users');
    `;
    
    if (allConstraints.length > 0) {
      console.log('Found constraints that might need fixing:');
      for (const constraint of allConstraints) {
        console.log(`\n- ${constraint.constraint_name} on ${constraint.table_name}.${constraint.column_name}`);
        console.log(`  References: ${constraint.foreign_schema}.${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
        
        // If it references auth.users, drop it
        if (constraint.foreign_schema === 'auth' && constraint.foreign_table_name === 'users') {
          console.log(`  ⚠️  Dropping constraint that references auth.users...`);
          await sql.unsafe(`
            ALTER TABLE public.${constraint.table_name}
            DROP CONSTRAINT IF EXISTS ${constraint.constraint_name};
          `);
          console.log(`  ✅ Dropped ${constraint.constraint_name}`);
        }
      }
    } else {
      console.log('No constraints found that reference auth.users');
    }
    
    // Also check for any constraint with 'users_user_id_fkey' in the name (case insensitive)
    const similarConstraints = await sql`
      SELECT 
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conname ILIKE '%users_user_id%'
         OR conname ILIKE '%user_id_fkey%';
    `;
    
    if (similarConstraints.length > 0) {
      console.log('\n\nFound constraints with similar names:');
      for (const constraint of similarConstraints) {
        console.log(`\n- ${constraint.constraint_name} on ${constraint.table_name}`);
        console.log(`  ${constraint.constraint_definition}`);
        
        // Drop it if it references auth.users (but skip auth schema tables)
        if (constraint.constraint_definition.includes('auth.users') && !constraint.table_name.toString().startsWith('auth.')) {
          console.log(`  ⚠️  Dropping constraint that references auth.users...`);
          await sql.unsafe(`
            ALTER TABLE ${constraint.table_name}
            DROP CONSTRAINT IF EXISTS ${constraint.constraint_name};
          `);
          console.log(`  ✅ Dropped ${constraint.constraint_name}`);
        } else if (constraint.table_name.toString().startsWith('auth.')) {
          console.log(`  ⏭️  Skipping auth schema table (no permission to modify)`);
        }
      }
    }
    
    // Ensure users.user_id has proper default
    console.log('\n\nEnsuring users.user_id has proper default...');
    await sql`
      ALTER TABLE public.users 
      ALTER COLUMN user_id SET DEFAULT uuid_generate_v4();
    `;
    console.log('✅ users.user_id default set');
    
    console.log('\n✅ All constraints fixed!');
  } catch (error) {
    console.error('❌ Error fixing constraints:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

fixAllConstraints().catch(console.error);

