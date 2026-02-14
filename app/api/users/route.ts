import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { eq, or, like, desc, and } from "drizzle-orm";
import { transformUser } from "@/lib/utils/transform";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = (session.user as any)?.role === "Admin";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const conditions = [];

    if (role) {
      conditions.push(eq(users.role, role as any));
    }

    if (search) {
      conditions.push(
        or(like(users.name, `%${search}%`), like(users.email, `%${search}%`))!
      );
    }

    let query = db.select().from(users);

    if (conditions.length > 0) {
      query = query.where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      ) as any;
    }

    const data = await query.orderBy(desc(users.createdAt));

    // Transform to snake_case for frontend
    const transformedUsers = data.map(transformUser);

    return NextResponse.json({ users: transformedUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, role } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists using Drizzle
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate user ID
    const userId = uuidv4();

    // Create user using Drizzle
    const [newUser] = await db
      .insert(users)
      .values({
        userId,
        name,
        email,
        passwordHash,
        phone: phone || null,
        role: (role || "Student") as
          | "Admin"
          | "Librarian"
          | "Student"
          | "Member",
      })
      .returning();

    // Transform to snake_case for frontend
    const transformedUser = transformUser(newUser);

    return NextResponse.json(
      { message: "User created successfully", user: transformedUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
