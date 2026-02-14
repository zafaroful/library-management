'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/app/components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!reportType) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${reportType}`);
      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      setReportData(data);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderReport = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'borrowing_trends':
        const trends = Object.entries(reportData.data.trends || {}).map(([month, data]: [string, any]) => ({
          month,
          borrowed: data.borrowed,
          returned: data.returned,
        }));
        return (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Borrowing Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="borrowed" stroke="#8884d8" />
                <Line type="monotone" dataKey="returned" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'popular_books':
        return (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Most Popular Books</h3>
            <div className="bg-white shadow rounded-lg p-6">
              <ul className="space-y-2">
                {reportData.data.popularBooks?.map((item: any, index: number) => (
                  <li key={index} className="flex justify-between items-center py-2 border-b">
                    <span>{item.book?.title} by {item.book?.author}</span>
                    <span className="font-semibold">{item.count} loans</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'overdue':
        return (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Overdue Loans</h3>
            <div className="bg-white shadow rounded-lg p-6">
              <ul className="space-y-2">
                {reportData.data.overdueLoans?.map((loan: any) => (
                  <li key={loan.loan_id} className="py-2 border-b">
                    <p className="font-medium">{loan.book?.title}</p>
                    <p className="text-sm text-gray-500">Borrower: {loan.user?.name}</p>
                    <p className="text-sm text-gray-500">Due: {loan.due_date}</p>
                    {loan.fine && (
                      <p className="text-sm text-red-600">Fine: ${loan.fine.amount}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'fines_collected':
        return (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Fines Report</h3>
            <div className="bg-white shadow rounded-lg p-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">${reportData.data.totalCollected?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Unpaid</p>
                <p className="text-2xl font-bold text-red-600">${reportData.data.totalUnpaid?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Paid Fines</p>
                <p className="text-xl font-semibold">{reportData.data.paidCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unpaid Fines</p>
                <p className="text-xl font-semibold">{reportData.data.unpaidCount}</p>
              </div>
            </div>
          </div>
        );

      case 'active_users':
        return (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Active Users</h3>
            <div className="bg-white shadow rounded-lg p-6">
              <ul className="space-y-2">
                {reportData.data.activeUsers?.map((item: any, index: number) => (
                  <li key={index} className="flex justify-between items-center py-2 border-b">
                    <span>{item.user?.name} ({item.user?.email})</span>
                    <span className="font-semibold">{item.count} active loans</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports & Analytics</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex space-x-4">
            <select
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="">Select Report Type</option>
              <option value="borrowing_trends">Borrowing Trends</option>
              <option value="popular_books">Popular Books</option>
              <option value="overdue">Overdue Books</option>
              <option value="fines_collected">Fines Collected</option>
              <option value="active_users">Active Users</option>
            </select>
            <Button onClick={generateReport} disabled={!reportType || loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {renderReport()}
      </div>
    </DashboardLayout>
  );
}

