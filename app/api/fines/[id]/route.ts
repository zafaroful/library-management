import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { fines, loans, books, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { transformFineWithDetails } from "@/lib/utils/transform";

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
    const { payment_status } = body;

    if (!["Paid", "Unpaid"].includes(payment_status)) {
      return NextResponse.json(
        { error: "Invalid payment status" },
        { status: 400 }
      );
    }

    // Get current fine with loan
    const [fineData] = await db
      .select({
        fine: fines,
        loan: loans,
      })
      .from(fines)
      .leftJoin(loans, eq(fines.loanId, loans.loanId))
      .where(eq(fines.fineId, id))
      .limit(1);

    if (!fineData || !fineData.fine) {
      return NextResponse.json({ error: "Fine not found" }, { status: 404 });
    }

    // Check permissions - users can only pay their own fines
    const isLibrarian = ["Admin", "Librarian"].includes(
      (session.user as any)?.role
    );
    if (!isLibrarian && fineData.loan?.userId !== (session.user as any)?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedFine] = await db
      .update(fines)
      .set({ paymentStatus: payment_status as any })
      .where(eq(fines.fineId, id))
      .returning();

    // Fetch with relations
    const [fineWithRelations] = await db
      .select({
        fine: fines,
        loan: loans,
        book: books,
        user: users,
      })
      .from(fines)
      .leftJoin(loans, eq(fines.loanId, loans.loanId))
      .leftJoin(books, eq(loans.bookId, books.bookId))
      .leftJoin(users, eq(loans.userId, users.userId))
      .where(eq(fines.fineId, id))
      .limit(1);

    // Transform to snake_case for frontend
    const formattedFine = transformFineWithDetails(fineWithRelations);

    return NextResponse.json(formattedFine);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
