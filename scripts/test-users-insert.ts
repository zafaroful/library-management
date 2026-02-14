import postgres from 'postgres';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function testUsersInsert() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('Testing users table insert...\n');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const userId = uuidv4();
    
    console.log('Attempting to insert test user...');
    console.log(`  Email: ${testEmail}`);
    console.log(`  User ID: ${userId}`);
    
    try {
      const result = await sql`
        INSERT INTO public.users (
          user_id,
          name,
          email,
          password_hash,
          role
        ) VALUES (
          ${userId},
          'Test User',
          ${testEmail},
          ${passwordHash},
          'Student'
        )
        RETURNING user_id, email, name, role;
      `;
      
      console.log('\n✅ Insert successful!');
      console.log('Inserted user:', result[0]);
      
      // Clean up - delete the test user
      console.log('\nCleaning up test user...');
      await sql`DELETE FROM public.users WHERE user_id = ${userId}`;
      console.log('✅ Test user deleted');
      
    } catch (insertError: any) {
      console.error('\n❌ Insert failed!');
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      console.error('Error detail:', insertError.detail);
      console.error('Error hint:', insertError.hint);
      
      if (insertError.message.includes('users_user_id_fkey')) {
        console.error('\n⚠️  This error mentions "users_user_id_fkey"');
        console.error('   However, this constraint does not exist in the database.');
        console.error('   This might be:');
        console.error('   1. A cached error message');
        console.error('   2. An error from a different source');
        console.error('   3. A trigger or function causing the issue');
      }
      
      throw insertError;
    }
    
    // Test insert with default user_id
    console.log('\n\nTesting insert with default user_id...');
    const testEmail2 = `test2-${Date.now()}@example.com`;
    
    try {
      const result2 = await sql`
        INSERT INTO public.users (
          name,
          email,
          password_hash,
          role
        ) VALUES (
          'Test User 2',
          ${testEmail2},
          ${passwordHash},
          'Member'
        )
        RETURNING user_id, email, name, role;
      `;
      
      console.log('✅ Insert with default user_id successful!');
      console.log('Inserted user:', result2[0]);
      
      // Clean up
      await sql`DELETE FROM public.users WHERE user_id = ${result2[0].user_id}`;
      console.log('✅ Test user 2 deleted');
      
    } catch (insertError2: any) {
      console.error('\n❌ Insert with default user_id failed!');
      console.error('Error:', insertError2.message);
      throw insertError2;
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

testUsersInsert().catch(console.error);

