import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { DashboardLayout } from "@/app/components/layout/DashboardLayout";
import { DashboardDiscover } from "@/app/components/dashboard/DashboardDiscover";
import { db } from "@/lib/db";
import { books, loans, users, reservations } from "@/lib/db/schema";
import { eq, lt, and, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BookOpen, ClipboardList, Users, AlertTriangle, BookMarked } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isLibrarian = ["Admin", "Librarian"].includes(
    (session.user as { role?: string })?.role ?? ""
  );

  let stats: Record<string, number> = {};

  if (isLibrarian) {
    const [booksCount, activeLoansCount, usersCount, overdueCount] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(books),
        db
          .select({ count: sql<number>`count(*)` })
          .from(loans)
          .where(eq(loans.status, "Borrowed")),
        db.select({ count: sql<number>`count(*)` }).from(users),
        db
          .select({ count: sql<number>`count(*)` })
          .from(loans)
          .where(
            and(
              eq(loans.status, "Borrowed"),
              lt(loans.dueDate, new Date().toISOString().split("T")[0])
            )
          ),
      ]);

    stats = {
      totalBooks: Number(booksCount[0]?.count ?? 0),
      activeLoans: Number(activeLoansCount[0]?.count ?? 0),
      totalUsers: Number(usersCount[0]?.count ?? 0),
      overdueLoans: Number(overdueCount[0]?.count ?? 0),
    };
  } else {
    const userId = (session.user as { id?: string })?.id;
    const [myLoansCount, myReservationsCount] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(and(eq(loans.userId, userId!), eq(loans.status, "Borrowed"))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(reservations)
        .where(
          and(eq(reservations.userId, userId!), eq(reservations.status, "Pending"))
        ),
    ]);

    stats = {
      myLoans: Number(myLoansCount[0]?.count ?? 0),
      myReservations: Number(myReservationsCount[0]?.count ?? 0),
    };
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {isLibrarian && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <BookOpen className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Total Books
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalBooks}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <ClipboardList className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Active Loans
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.activeLoans}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <Users className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Total Users
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <AlertTriangle className="size-5 text-destructive" />
                <span className="text-sm font-medium text-muted-foreground">
                  Overdue Loans
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">
                  {stats.overdueLoans}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!isLibrarian && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <ClipboardList className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  My Loans
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.myLoans}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <BookMarked className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  My Reservations
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.myReservations}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <DashboardDiscover />
      </div>
    </DashboardLayout>
  );
}
