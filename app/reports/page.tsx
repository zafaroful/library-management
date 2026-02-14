'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string>('');
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!reportType) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${reportType}`);
      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      setReportData(data);
    } catch (error: unknown) {
      alert(
        error instanceof Error ? error.message : 'Failed to generate report'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderReport = () => {
    if (!reportData) return null;

    const data = reportData.data as Record<string, unknown>;

    switch (reportType) {
      case 'borrowing_trends': {
        const trends = Object.entries(data.trends || {}).map(
          ([month, trendData]: [string, unknown]) => {
            const t = trendData as { borrowed?: number; returned?: number };
            return {
              month,
              borrowed: t.borrowed ?? 0,
              returned: t.returned ?? 0,
            };
          }
        );
        return (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Borrowing Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="borrowed"
                    stroke="hsl(var(--chart-1))"
                  />
                  <Line
                    type="monotone"
                    dataKey="returned"
                    stroke="hsl(var(--chart-2))"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      }

      case 'popular_books': {
        const popularBooks = (data.popularBooks as { book?: { title: string; author: string }; count: number }[]) || [];
        return (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Most Popular Books</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {popularBooks.map((item, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center border-b py-2"
                  >
                    <span>
                      {item.book?.title} by {item.book?.author}
                    </span>
                    <span className="font-semibold">{item.count} loans</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      }

      case 'overdue': {
        const overdueLoans = (data.overdueLoans as { loan_id: string; book?: { title: string }; user?: { name: string }; due_date: string; fine?: { amount: number } }[]) || [];
        return (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Overdue Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {overdueLoans.map((loan) => (
                  <li key={loan.loan_id} className="border-b py-2">
                    <p className="font-medium">{loan.book?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Borrower: {loan.user?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due: {loan.due_date}
                    </p>
                    {loan.fine && (
                      <p className="text-sm text-destructive">
                        Fine: ${loan.fine.amount}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      }

      case 'fines_collected': {
        const totalCollected = data.totalCollected as number | undefined;
        const totalUnpaid = data.totalUnpaid as number | undefined;
        const paidCount = data.paidCount as number | undefined;
        const unpaidCount = data.unpaidCount as number | undefined;
        return (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Fines Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                  <p className="text-2xl font-bold text-primary">
                    ${totalCollected?.toFixed(2) ?? '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Unpaid</p>
                  <p className="text-2xl font-bold text-destructive">
                    ${totalUnpaid?.toFixed(2) ?? '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid Fines</p>
                  <p className="text-xl font-semibold">{paidCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unpaid Fines</p>
                  <p className="text-xl font-semibold">{unpaidCount ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      case 'active_users': {
        const activeUsers = (data.activeUsers as { user?: { name: string; email: string }; count: number }[]) || [];
        return (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {activeUsers.map((item, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center border-b py-2"
                  >
                    <span>
                      {item.user?.name} ({item.user?.email})
                    </span>
                    <span className="font-semibold">
                      {item.count} active loans
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      }

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Reports & Analytics
        </h1>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Select
                value={reportType || undefined}
                onValueChange={setReportType}
              >
                <SelectTrigger className="w-full sm:max-w-xs">
                  <SelectValue placeholder="Select Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrowing_trends">
                    Borrowing Trends
                  </SelectItem>
                  <SelectItem value="popular_books">Popular Books</SelectItem>
                  <SelectItem value="overdue">Overdue Books</SelectItem>
                  <SelectItem value="fines_collected">Fines Collected</SelectItem>
                  <SelectItem value="active_users">Active Users</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={generateReport}
                disabled={!reportType || loading}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {renderReport()}
      </div>
    </DashboardLayout>
  );
}
