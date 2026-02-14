import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { loans, books, users } from "@/lib/db/schema";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { calculateDueDate, formatDate } from "@/lib/utils/date";
import { transformLoanWithDetails } from "@/lib/utils/transform";

const loanSchema = z.object({
  book_id: z.string().uuid(),
  user_id: z.string().uuid(),
  borrow_date: z.string().optional(),
  due_date: z.string().optional(),
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

    // Non-librarians can only see their own loans
    if (!isLibrarian) {
      conditions.push(eq(loans.userId, sessionUserId));
    } else if (userIdParam) {
      conditions.push(eq(loans.userId, userIdParam));
    }

    if (status) {
      conditions.push(eq(loans.status, status as any));
    }

    let query = db
      .select({
        loan: loans,
        book: books,
        user: users,
      })
      .from(loans)
      .leftJoin(books, eq(loans.bookId, books.bookId))
      .leftJoin(users, eq(loans.userId, users.userId));

    if (conditions.length > 0) {
      query = query.where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      ) as any;
    }

    const data = await query.orderBy(desc(loans.borrowDate));

    // Transform to snake_case for frontend
    const formattedLoans = data.map(transformLoanWithDetails);

    return NextResponse.json({ loans: formattedLoans });
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

    const isLibrarian = ["Admin", "Librarian"].includes(
      (session.user as any)?.role
    );
    if (!isLibrarian) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = loanSchema.parse(body);

    // Check if book is available
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.bookId, validatedData.book_id))
      .limit(1);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.copiesAvailable <= 0) {
      return NextResponse.json(
        { error: "Book is not available" },
        { status: 400 }
      );
    }

    // Check if user already has this book borrowed
    const [existingLoan] = await db
      .select()
      .from(loans)
      .where(
        and(
          eq(loans.bookId, validatedData.book_id),
          eq(loans.userId, validatedData.user_id),
          eq(loans.status, "Borrowed")
        )
      )
      .limit(1);

    if (existingLoan) {
      return NextResponse.json(
        { error: "User already has this book borrowed" },
        { status: 400 }
      );
    }

    const borrowDate = validatedData.borrow_date
      ? new Date(validatedData.borrow_date)
      : new Date();
    const dueDate = validatedData.due_date
      ? new Date(validatedData.due_date)
      : calculateDueDate(borrowDate);

    const [newLoan] = await db
      .insert(loans)
      .values({
        bookId: validatedData.book_id,
        userId: validatedData.user_id,
        borrowDate: formatDate(borrowDate),
        dueDate: formatDate(dueDate),
        status: "Borrowed",
      })
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
      .where(eq(loans.loanId, newLoan.loanId))
      .limit(1);

    // Transform to snake_case for frontend
    const formattedLoan = transformLoanWithDetails(loanWithRelations);

    return NextResponse.json(formattedLoan, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
