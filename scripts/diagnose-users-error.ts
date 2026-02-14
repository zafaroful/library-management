import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function diagnoseUsersError() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('Diagnosing users table foreign key issue...\n');
    
    // Check users table structure
    console.log('1. Users table structure:');
    const usersColumns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position;
    `;
    
    usersColumns.forEach((col: any) => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check all constraints on users table
    console.log('\n2. All constraints on users table:');
    const allConstraints = await sql`
      SELECT 
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'public.users'::regclass
      ORDER BY conname;
    `;
    
    allConstraints.forEach((constraint: any) => {
      console.log(`   ${constraint.constraint_name} (${constraint.constraint_type}): ${constraint.constraint_definition}`);
    });
    
    // Check if there are any foreign keys pointing TO users
    console.log('\n3. Foreign keys pointing TO users table:');
    const fksToUsers = await sql`
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
        AND ccu.table_name = 'users'
        AND ccu.table_schema = 'public';
    `;
    
    if (fksToUsers.length > 0) {
      fksToUsers.forEach((fk: any) => {
        console.log(`   ${fk.table_name}.${fk.column_name} -> users.${fk.foreign_column_name} (${fk.constraint_name})`);
      });
    } else {
      console.log('   None found');
    }
    
    // Try to find any constraint with 'users_user_id_fkey' in name
    console.log('\n4. Searching for constraint with "users_user_id_fkey" in name:');
    const specificConstraint = await sql`
      SELECT 
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conname = 'users_user_id_fkey';
    `;
    
    if (specificConstraint.length > 0) {
      console.log(`   Found: ${specificConstraint[0].constraint_name} on ${specificConstraint[0].table_name}`);
      console.log(`   Definition: ${specificConstraint[0].constraint_definition}`);
    } else {
      console.log('   Not found - constraint does not exist');
    }
    
    console.log('\n✅ Diagnosis complete');
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

diagnoseUsersError().catch(console.error);

