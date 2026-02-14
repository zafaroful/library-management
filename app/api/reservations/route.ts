import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { reservations, books, users } from "@/lib/db/schema";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { transformReservationWithDetails } from "@/lib/utils/transform";

const reservationSchema = z.object({
  book_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userIdParam = searchParams.get("user_id");

    const isLibrarian = ["Admin", "Librarian"].includes(
      (session.user as any)?.role
    );
    const sessionUserId = (session.user as any)?.id;

    const conditions = [];

    // Non-librarians can only see their own reservations
    if (!isLibrarian) {
      conditions.push(eq(reservations.userId, sessionUserId));
    } else if (userIdParam) {
      conditions.push(eq(reservations.userId, userIdParam));
    }

    if (status) {
      conditions.push(eq(reservations.status, status as any));
    }

    let query = db
      .select({
        reservation: reservations,
        book: books,
        user: users,
      })
      .from(reservations)
      .leftJoin(books, eq(reservations.bookId, books.bookId))
      .leftJoin(users, eq(reservations.userId, users.userId));

    if (conditions.length > 0) {
      query = query.where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      ) as any;
    }

    const data = await query.orderBy(desc(reservations.reservationDate));

    // Transform to snake_case for frontend
    const formattedReservations = data.map(transformReservationWithDetails);

    return NextResponse.json({ reservations: formattedReservations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reservationSchema.parse(body);
    const userId = validatedData.user_id || (session.user as any)?.id;

    // Check if book exists
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.bookId, validatedData.book_id))
      .limit(1);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Check if user already has a pending reservation for this book
    const [existingReservation] = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.bookId, validatedData.book_id),
          eq(reservations.userId, userId),
          eq(reservations.status, "Pending")
        )
      )
      .limit(1);

    if (existingReservation) {
      return NextResponse.json(
        {
          error: "You already have a pending reservation for this book",
        },
        { status: 400 }
      );
    }

    const [newReservation] = await db
      .insert(reservations)
      .values({
        bookId: validatedData.book_id,
        userId: userId,
        status: "Pending",
      })
      .returning();

    // Fetch with relations
    const [reservationWithRelations] = await db
      .select({
        reservation: reservations,
        book: books,
        user: users,
      })
      .from(reservations)
      .leftJoin(books, eq(reservations.bookId, books.bookId))
      .leftJoin(users, eq(reservations.userId, users.userId))
      .where(eq(reservations.reservationId, newReservation.reservationId))
      .limit(1);

    // Transform to snake_case for frontend
    const formattedReservation = transformReservationWithDetails(
      reservationWithRelations
    );

    return NextResponse.json(formattedReservation, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
