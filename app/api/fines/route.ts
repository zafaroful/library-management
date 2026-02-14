import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { fines, loans, books, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { transformFineWithDetails } from "@/lib/utils/transform";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentStatus = searchParams.get("payment_status");
    const userIdParam = searchParams.get("user_id");

    const isLibrarian = ["Admin", "Librarian"].includes(
      (session.user as any)?.role
    );
    const sessionUserId = (session.user as any)?.id;

    const conditions = [];

    // Non-librarians can only see their own fines
    if (!isLibrarian) {
      conditions.push(eq(loans.userId, sessionUserId));
    } else if (userIdParam) {
      conditions.push(eq(loans.userId, userIdParam));
    }

    if (paymentStatus) {
      conditions.push(eq(fines.paymentStatus, paymentStatus as any));
    }

    let query = db
      .select({
        fine: fines,
        loan: loans,
        book: books,
        user: users,
      })
      .from(fines)
      .leftJoin(loans, eq(fines.loanId, loans.loanId))
      .leftJoin(books, eq(loans.bookId, books.bookId))
      .leftJoin(users, eq(loans.userId, users.userId));

    if (conditions.length > 0) {
      query = query.where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      ) as any;
    }

    const data = await query.orderBy(desc(fines.createdAt));

    // Transform to snake_case for frontend
    const formattedFines = data.map(transformFineWithDetails);

    return NextResponse.json({ fines: formattedFines });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
