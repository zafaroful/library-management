import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkTriggersFunctions() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('Checking triggers and functions...\n');
    
    // Check triggers on users table
    console.log('1. Triggers on users table:');
    const triggers = await sql`
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
        AND event_object_table = 'users';
    `;
    
    if (triggers.length > 0) {
      triggers.forEach((trigger: any) => {
        console.log(`   - ${trigger.trigger_name} (${trigger.action_timing} ${trigger.event_manipulation})`);
        console.log(`     ${trigger.action_statement}`);
      });
    } else {
      console.log('   None found');
    }
    
    // Check all functions
    console.log('\n2. Functions in public schema:');
    const functions = await sql`
      SELECT 
        routine_name,
        routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      ORDER BY routine_name;
    `;
    
    if (functions.length > 0) {
      functions.forEach((func: any) => {
        console.log(`   - ${func.routine_name} (${func.routine_type})`);
      });
    } else {
      console.log('   None found');
    }
    
    // Check if there's any reference to 'users_user_id_fkey' in function definitions
    console.log('\n3. Searching for "users_user_id_fkey" in function definitions...');
    const funcDefinitions = await sql`
      SELECT 
        routine_name,
        routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_definition LIKE '%users_user_id_fkey%';
    `;
    
    if (funcDefinitions.length > 0) {
      console.log('   Found references:');
      funcDefinitions.forEach((func: any) => {
        console.log(`   - ${func.routine_name}`);
        const match = func.routine_definition.match(/users_user_id_fkey[^;]*/);
        if (match) {
          console.log(`     ${match[0].substring(0, 100)}...`);
        }
      });
    } else {
      console.log('   ✅ No references found');
    }
    
    console.log('\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

checkTriggersFunctions().catch(console.error);

