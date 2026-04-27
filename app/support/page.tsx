'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InputField } from '@/components/ui/input-field';
import { Badge } from '@/components/ui/badge';

type Ticket = {
  ticket_id: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: string;
  created_at: string;
  user_name: string;
  user_email: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const FAQ_ITEMS = [
  {
    q: 'How do I borrow a book?',
    a: 'Open Books/Discover, select a book, and use Issue Loan (staff) or follow your role-specific borrow flow.',
  },
  {
    q: 'Why is a reservation not visible?',
    a: 'Check Reservations filter (All/Pending). If none exist, no reservation records have been created yet.',
  },
  {
    q: 'How do I add recitation audio?',
    a: 'Go to Recitations. You can upload MP3/M4A/MP4 or provide an audio URL/path.',
  },
  {
    q: 'Where can I find overdue/fine information?',
    a: 'Use Loans and Fines pages. Reports also includes Overdue and Fines summaries for staff roles.',
  },
];

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical');
  const [priority, setPriority] = useState('Medium');
  const [message, setMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketLoading, setTicketLoading] = useState(true);

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi! I can help with common library questions. Ask about loans, reservations, fines, or reports.',
    },
  ]);

  const loadTickets = async () => {
    setTicketLoading(true);
    try {
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load tickets');
      setTickets(data.tickets || []);
    } catch {
      setTickets([]);
    } finally {
      setTicketLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const submitTicket = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitLoading(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          priority,
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : Array.isArray(data.error)
              ? data.error.map((i: { message?: string }) => i.message).join(', ')
              : 'Failed to submit ticket'
        );
      }
      setSubmitSuccess(`Ticket submitted: ${data.ticket.ticket_id}`);
      setSubject('');
      setCategory('Technical');
      setPriority('Medium');
      setMessage('');
      await loadTickets();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit ticket'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const sendChatMessage = async () => {
    const question = chatInput.trim();
    if (!question || chatLoading) return;

    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: question }]);
    setChatLoading(true);
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Assistant unavailable');
      }
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response || 'No response' },
      ]);
    } catch (err: unknown) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err instanceof Error ? err.message : 'Assistant unavailable right now',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit support tickets, use live chat, and browse FAQs.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Submit a ticket</CardTitle>
              <CardDescription>
                Create a support request and track it below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitTicket} className="space-y-4">
                <InputField
                  label="Subject"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Briefly describe your issue"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      aria-label="Ticket category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="Account">Account</option>
                      <option value="Loans">Loans</option>
                      <option value="Reservations">Reservations</option>
                      <option value="Fines">Fines</option>
                      <option value="Technical">Technical</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <select
                      aria-label="Ticket priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    minLength={10}
                    rows={5}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Include steps, page URL, and any error text."
                  />
                </div>
                {submitError && (
                  <p className="text-sm text-destructive">{submitError}</p>
                )}
                {submitSuccess && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {submitSuccess}
                  </p>
                )}
                <Button type="submit" disabled={submitLoading}>
                  {submitLoading ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live chat</CardTitle>
              <CardDescription>
                Ask quick questions without leaving Support.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-md px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'ml-8 bg-primary/10'
                        : 'mr-8 bg-muted'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {chatLoading && (
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a support question..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendChatMessage();
                  }}
                />
                <Button onClick={sendChatMessage} disabled={chatLoading}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>FAQ</CardTitle>
              <CardDescription>Common support answers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.q}
                  className="rounded-md border bg-card px-3 py-2"
                >
                  <summary className="cursor-pointer text-sm font-medium">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent tickets</CardTitle>
              <CardDescription>
                Latest support tickets visible to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ticketLoading ? (
                <p className="text-sm text-muted-foreground">Loading tickets...</p>
              ) : tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tickets yet. Submit one using the form.
                </p>
              ) : (
                <ul className="space-y-3">
                  {tickets.map((ticket) => (
                    <li key={ticket.ticket_id} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{ticket.subject}</p>
                        <Badge variant="outline">{ticket.status}</Badge>
                        <Badge variant="secondary">{ticket.priority}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ticket.category} •{' '}
                        {new Date(ticket.created_at).toLocaleString()}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {ticket.message}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Quick navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to Discover</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
