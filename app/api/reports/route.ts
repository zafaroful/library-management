import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  loans,
  books,
  users,
  fines,
  reports,
} from "@/lib/db/schema";
import { eq, lt, sql, asc, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");

    let reportData: any = {};

    switch (reportType) {
      case "borrowing_trends": {
        // Get loans grouped by month
        const allLoans = await db
          .select({
            borrowDate: loans.borrowDate,
            status: loans.status,
          })
          .from(loans)
          .orderBy(asc(loans.borrowDate));

        const trends = allLoans.reduce((acc: any, loan: any) => {
          const month = loan.borrowDate?.toString().substring(0, 7); // YYYY-MM
          if (!month) return acc;
          if (!acc[month]) {
            acc[month] = { borrowed: 0, returned: 0 };
          }
          if (loan.status === "Borrowed") acc[month].borrowed++;
          if (loan.status === "Returned") acc[month].returned++;
          return acc;
        }, {});

        reportData = { trends };
        break;
      }

      case "popular_books": {
        const popularBooksData = await db
          .select({
            bookId: loans.bookId,
            book: books,
            count: sql<number>`count(*)`.as("count"),
          })
          .from(loans)
          .leftJoin(books, eq(loans.bookId, books.bookId))
          .where(eq(loans.status, "Borrowed"))
          .groupBy(loans.bookId, books.bookId)
          .orderBy(desc(sql`count(*)`))
          .limit(10);

        reportData = {
          popularBooks: popularBooksData.map((item) => ({
            book_id: item.bookId,
            book: item.book,
            count: Number(item.count),
          })),
        };
        break;
      }

      case "overdue": {
        const today = new Date().toISOString().split("T")[0];
        const overdueLoansData = await db
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
          .where(and(eq(loans.status, "Borrowed"), lt(loans.dueDate, today)));

        const overdueLoans = overdueLoansData.map((row) => ({
          ...row.loan,
          book: row.book,
          user: row.user,
          fine: row.fine || null,
        }));

        reportData = { overdueLoans };
        break;
      }

      case "fines_collected": {
        const paidFines = await db
          .select()
          .from(fines)
          .where(eq(fines.paymentStatus, "Paid"));

        const unpaidFines = await db
          .select()
          .from(fines)
          .where(eq(fines.paymentStatus, "Unpaid"));

        const totalCollected =
          paidFines.reduce(
            (sum, fine) => sum + parseFloat(fine.amount.toString()),
            0
          ) || 0;
        const totalUnpaid =
          unpaidFines.reduce(
            (sum, fine) => sum + parseFloat(fine.amount.toString()),
            0
          ) || 0;

        reportData = {
          totalCollected,
          totalUnpaid,
          paidCount: paidFines.length || 0,
          unpaidCount: unpaidFines.length || 0,
        };
        break;
      }

      case "active_users": {
        const activeUsersData = await db
          .select({
            userId: loans.userId,
            user: users,
            count: sql<number>`count(*)`.as("count"),
          })
          .from(loans)
          .leftJoin(users, eq(loans.userId, users.userId))
          .where(eq(loans.status, "Borrowed"))
          .groupBy(loans.userId, users.userId)
          .orderBy(desc(sql`count(*)`));

        const userCounts = activeUsersData.map((item) => ({
          user_id: item.userId,
          user: item.user,
          count: Number(item.count),
        }));

        reportData = {
          activeUsers: userCounts.sort((a: any, b: any) => b.count - a.count),
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    // Save report to database
    const [savedReport] = await db
      .insert(reports)
      .values({
        generatedBy: (session.user as any)?.id,
        reportType: reportType || "general",
        reportData: reportData,
      })
      .returning();

    return NextResponse.json({
      report: savedReport,
      data: reportData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
