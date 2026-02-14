import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function findUsersFkey() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('Searching for users_user_id_fkey constraint...\n');
    
    // Search for constraint by exact name
    const exactMatch = await sql`
      SELECT 
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        confrelid::regclass AS foreign_table_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conname = 'users_user_id_fkey';
    `;
    
    if (exactMatch.length > 0) {
      console.log('✅ Found constraint with exact name:');
      exactMatch.forEach((constraint: any) => {
        console.log(`\n  Constraint: ${constraint.constraint_name}`);
        console.log(`  Table: ${constraint.table_name}`);
        console.log(`  Foreign Table: ${constraint.foreign_table_name}`);
        console.log(`  Definition: ${constraint.constraint_definition}`);
        
        // Drop it
        console.log(`\n  ⚠️  Dropping constraint...`);
        sql.unsafe(`ALTER TABLE ${constraint.table_name} DROP CONSTRAINT IF EXISTS ${constraint.constraint_name};`)
          .then(() => {
            console.log(`  ✅ Dropped ${constraint.constraint_name}`);
          })
          .catch((err: any) => {
            console.error(`  ❌ Error dropping: ${err.message}`);
          });
      });
    } else {
      console.log('❌ No constraint found with exact name "users_user_id_fkey"');
    }
    
    // Search for any constraint with similar name
    console.log('\n\nSearching for constraints with "user_id_fkey" in name...');
    const similar = await sql`
      SELECT 
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        confrelid::regclass AS foreign_table_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conname LIKE '%user_id_fkey%'
         OR conname LIKE '%users_user_id%';
    `;
    
    if (similar.length > 0) {
      console.log(`Found ${similar.length} similar constraint(s):`);
      similar.forEach((constraint: any) => {
        console.log(`\n  Constraint: ${constraint.constraint_name}`);
        console.log(`  Table: ${constraint.table_name}`);
        console.log(`  Foreign Table: ${constraint.foreign_table_name}`);
        console.log(`  Definition: ${constraint.constraint_definition}`);
      });
    } else {
      console.log('No similar constraints found');
    }
    
    // Check ALL foreign key constraints on users table
    console.log('\n\nAll foreign key constraints on users table:');
    const allFks = await sql`
      SELECT 
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        confrelid::regclass AS foreign_table_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'public.users'::regclass
        AND contype = 'f';
    `;
    
    if (allFks.length > 0) {
      console.log(`Found ${allFks.length} foreign key constraint(s) on users table:`);
      for (const fk of allFks) {
        console.log(`\n  Constraint: ${fk.constraint_name}`);
        console.log(`  Foreign Table: ${fk.foreign_table_name}`);
        console.log(`  Definition: ${fk.constraint_definition}`);
        
        // If it references auth.users or users itself, drop it
        if (fk.foreign_table_name.toString().includes('auth.users') || 
            fk.foreign_table_name.toString() === 'users') {
          console.log(`  ⚠️  Dropping constraint that references ${fk.foreign_table_name}...`);
          await sql.unsafe(`ALTER TABLE public.users DROP CONSTRAINT IF EXISTS ${fk.constraint_name};`);
          console.log(`  ✅ Dropped ${fk.constraint_name}`);
        }
      }
    } else {
      console.log('No foreign key constraints found on users table');
    }
    
    // Also check in information_schema
    console.log('\n\nChecking information_schema for foreign keys...');
    const infoSchemaFks = await sql`
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
        AND tc.table_name = 'users';
    `;
    
    if (infoSchemaFks.length > 0) {
      console.log(`Found ${infoSchemaFks.length} foreign key(s) in information_schema:`);
      infoSchemaFks.forEach((fk: any) => {
        console.log(`\n  ${fk.constraint_name}`);
        console.log(`  ${fk.table_name}.${fk.column_name} -> ${fk.foreign_schema}.${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('No foreign keys found in information_schema');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

findUsersFkey().catch(console.error);

