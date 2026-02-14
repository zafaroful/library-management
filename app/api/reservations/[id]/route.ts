import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { reservations, books, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { transformReservationWithDetails } from "@/lib/utils/transform";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["Pending", "Collected", "Cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get current reservation
    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.reservationId, id))
      .limit(1);

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const isLibrarian = ["Admin", "Librarian"].includes(
      (session.user as any)?.role
    );
    if (
      !isLibrarian &&
      reservation.userId !== (session.user as any)?.id &&
      status !== "Cancelled"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedReservation] = await db
      .update(reservations)
      .set({ status: status as any })
      .where(eq(reservations.reservationId, id))
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
      .where(eq(reservations.reservationId, id))
      .limit(1);

    // Transform to snake_case for frontend
    const formattedReservation = transformReservationWithDetails(
      reservationWithRelations
    );

    return NextResponse.json(formattedReservation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get current reservation
    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.reservationId, id))
      .limit(1);

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check permissions - users can only cancel their own reservations
    const isLibrarian = ["Admin", "Librarian"].includes(
      (session.user as any)?.role
    );
    if (!isLibrarian && reservation.userId !== (session.user as any)?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(reservations).where(eq(reservations.reservationId, id));

    return NextResponse.json({
      message: "Reservation deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
