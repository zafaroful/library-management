import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function ensureUsersCorrect() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('Ensuring users table is correctly configured...\n');
    
    // 1. Drop any foreign key constraint that might reference auth.users (if it somehow exists)
    console.log('1. Checking for any foreign key constraints on users table...');
    const fkConstraints = await sql`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'public.users'::regclass
        AND contype = 'f';
    `;
    
    if (fkConstraints.length > 0) {
      console.log(`   Found ${fkConstraints.length} foreign key constraint(s) on users table:`);
      for (const fk of fkConstraints) {
        console.log(`   - ${fk.constraint_name}: ${fk.constraint_definition}`);
        if (fk.constraint_definition.includes('auth.users')) {
          console.log(`     ⚠️  Dropping constraint that references auth.users...`);
          await sql.unsafe(`ALTER TABLE public.users DROP CONSTRAINT IF EXISTS ${fk.constraint_name};`);
          console.log(`     ✅ Dropped`);
        }
      }
    } else {
      console.log('   ✅ No foreign key constraints found on users table');
    }
    
    // 2. Ensure user_id has default
    console.log('\n2. Ensuring user_id has default value...');
    await sql`
      ALTER TABLE public.users 
      ALTER COLUMN user_id SET DEFAULT uuid_generate_v4();
    `;
    console.log('   ✅ user_id default set');
    
    // 3. Ensure password_hash is NOT NULL
    console.log('\n3. Ensuring password_hash is NOT NULL...');
    // First check for NULL values
    const nullCount = await sql`
      SELECT COUNT(*)::int as count 
      FROM public.users 
      WHERE password_hash IS NULL;
    `;
    
    if (nullCount[0].count > 0) {
      console.log(`   ⚠️  Warning: Found ${nullCount[0].count} users with NULL password_hash`);
      console.log('   ⚠️  These users need to be updated or deleted before setting NOT NULL');
    } else {
      await sql`
        ALTER TABLE public.users 
        ALTER COLUMN password_hash SET NOT NULL;
      `;
      console.log('   ✅ password_hash is NOT NULL');
    }
    
    // 4. Verify the table structure
    console.log('\n4. Verifying table structure...');
    const structure = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position;
    `;
    
    console.log('   Users table structure:');
    structure.forEach((col: any) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
    });
    
    console.log('\n✅ Users table is correctly configured!');
    console.log('\nNote: If you\'re still getting the error, it might be:');
    console.log('  1. A cached constraint name - try restarting your database connection');
    console.log('  2. An error from a different table that references users');
    console.log('  3. An issue with the user_id value being inserted (must be a valid UUID)');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

ensureUsersCorrect().catch(console.error);

