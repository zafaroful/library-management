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

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildCsvContent(
  reportType: string,
  reportData: Record<string, any>
): string {
  let rows: unknown[][] = [];

  switch (reportType) {
    case "borrowing_trends": {
      const trends = Object.entries(reportData.trends || {}).map(
        ([month, values]) => {
          const trend = values as { borrowed?: number; returned?: number };
          return [month, trend.borrowed ?? 0, trend.returned ?? 0];
        }
      );
      rows = [["Month", "Borrowed", "Returned"], ...trends];
      break;
    }

    case "popular_books": {
      rows = [
        ["Book Title", "Author", "Loan Count"],
        ...((reportData.popularBooks as any[]) || []).map((item) => [
          item.book?.title ?? "",
          item.book?.author ?? "",
          item.count ?? 0,
        ]),
      ];
      break;
    }

    case "overdue": {
      rows = [
        ["Loan ID", "Book Title", "Borrower", "Due Date", "Fine Amount"],
        ...((reportData.overdueLoans as any[]) || []).map((loan) => [
          loan.loanId ?? "",
          loan.book?.title ?? "",
          loan.user?.name ?? "",
          loan.dueDate ?? "",
          loan.fine?.amount ?? "",
        ]),
      ];
      break;
    }

    case "fines_collected": {
      rows = [
        ["Metric", "Value"],
        ["Total Collected", reportData.totalCollected ?? 0],
        ["Total Unpaid", reportData.totalUnpaid ?? 0],
        ["Paid Fines", reportData.paidCount ?? 0],
        ["Unpaid Fines", reportData.unpaidCount ?? 0],
      ];
      break;
    }

    case "active_users": {
      rows = [
        ["User Name", "Email", "Active Loans"],
        ...((reportData.activeUsers as any[]) || []).map((item) => [
          item.user?.name ?? "",
          item.user?.email ?? "",
          item.count ?? 0,
        ]),
      ];
      break;
    }

    default:
      rows = [["Message"], ["No data available"]];
  }

  return rows
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
    .join("\n");
}

function getCsvFilename(reportType: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `${reportType}-${date}.csv`;
}

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
    const format = searchParams.get("format");

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

    if (format === "csv") {
      const csvContent = buildCsvContent(reportType || "general", reportData);
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${getCsvFilename(
            reportType || "report"
          )}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({
      report: savedReport,
      data: reportData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
