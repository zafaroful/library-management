import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { loans, books, users, fines } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { formatDate } from "@/lib/utils/date";
import { transformLoanWithDetails, transformFine } from "@/lib/utils/transform";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isLibrarian = ["Admin", "Librarian"].includes(
      (session.user as any)?.role
    );

    const [loanData] = await db
      .select({
        loan: loans,
        book: books,
        user: users,
        fine: fines,
      })
      .from(loans)
      .leftJoin(books, eq(loans.bookId, books.bookId))
      .leftJoin(users, eq(loans.userId, users.userId))
      .leftJoin(fines, eq(loans.loanId, fines.loanId))
      .where(eq(loans.loanId, id))
      .limit(1);

    if (!loanData || !loanData.loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Check if user has permission
    if (!isLibrarian && loanData.loan.userId !== (session.user as any)?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Transform to snake_case for frontend
    const formattedLoan = {
      ...transformLoanWithDetails(loanData),
      fine: loanData.fine ? transformFine(loanData.fine) : null,
    };

    return NextResponse.json(formattedLoan);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isLibrarian = ["Admin", "Librarian"].includes(
      (session.user as any)?.role
    );
    if (!isLibrarian) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === "return") {
      const returnDate = body.return_date
        ? new Date(body.return_date)
        : new Date();

      const [updatedLoan] = await db
        .update(loans)
        .set({
          returnDate: formatDate(returnDate),
          status: "Returned",
        })
        .where(eq(loans.loanId, id))
        .returning();

      // Fetch with relations
      const [loanWithRelations] = await db
        .select({
          loan: loans,
          book: books,
          user: users,
        })
        .from(loans)
        .leftJoin(books, eq(loans.bookId, books.bookId))
        .leftJoin(users, eq(loans.userId, users.userId))
        .where(eq(loans.loanId, id))
        .limit(1);

      // Transform to snake_case for frontend
      const formattedLoan = transformLoanWithDetails(loanWithRelations);

      return NextResponse.json(formattedLoan);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
