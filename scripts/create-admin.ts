import postgres from "postgres";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

async function createAdmin() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@library.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const adminName = process.env.ADMIN_NAME || "Admin User";

    console.log("Creating admin user...\n");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Name: ${adminName}\n`);

    // Check if admin already exists
    const existingAdmin = await sql`
      SELECT user_id, email FROM public.users WHERE email = ${adminEmail}
    `;

    if (existingAdmin.length > 0) {
      console.log("⚠️  Admin user already exists!");
      console.log(`   User ID: ${existingAdmin[0].user_id}`);
      console.log(`   Email: ${existingAdmin[0].email}`);
      console.log("\nTo update the password, delete the user first or use a different email.");
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const userId = uuidv4();

    // Create admin user
    const [newAdmin] = await sql`
      INSERT INTO public.users (
        user_id,
        name,
        email,
        password_hash,
        role
      ) VALUES (
        ${userId},
        ${adminName},
        ${adminEmail},
        ${passwordHash},
        'Admin'
      )
      RETURNING user_id, email, name, role, created_at;
    `;

    console.log("✅ Admin user created successfully!");
    console.log("\nAdmin Details:");
    console.log(`  User ID: ${newAdmin.user_id}`);
    console.log(`  Name: ${newAdmin.name}`);
    console.log(`  Email: ${newAdmin.email}`);
    console.log(`  Role: ${newAdmin.role}`);
    console.log(`  Created: ${newAdmin.created_at}`);
    console.log("\nYou can now log in with:");
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
  } catch (error: any) {
    console.error("❌ Error creating admin:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

createAdmin().catch(console.error);

