'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function assistantErrorMessage(status: number, serverError?: string): string {
  if (status === 401) {
    return 'You need to be signed in to use the assistant. Try refreshing the page or logging in again.';
  }
  if (serverError) return serverError;
  if (status === 500) {
    return 'The assistant could not reach the AI service or save your message. If you are the developer, check OPENAI_API_KEY in .env and that the chatbot_interaction table exists.';
  }
  return 'Something went wrong. Please try again in a moment.';
}

export function Chatbot() {
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! How can I help you with the library today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const question = input.trim();
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      let data: { response?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* non-JSON body */
      }

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: assistantErrorMessage(res.status, data.error),
          },
        ]);
        return;
      }

      if (typeof data.response !== 'string' || !data.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'The assistant returned an empty reply. Check the server configuration.',
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response! },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Could not reach the server. Check your connection and that the app is running.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="bg-primary text-primary-foreground fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-border shadow-lg transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label="Open Library Assistant"
      >
        <MessageCircle className="h-7 w-7" aria-hidden />
      </button>
    );
  }

  return (
    <div className="bg-card border-border fixed bottom-4 right-4 z-50 flex h-[min(600px,85vh)] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-lg border shadow-2xl">
      <div className="bg-primary text-primary-foreground flex shrink-0 items-center justify-between gap-2 rounded-t-lg px-4 py-3">
        <h3 className="font-semibold">Library Assistant</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
          onClick={() => setMinimized(true)}
          aria-label="Minimize Library Assistant"
        >
          <Minus className="h-5 w-5" aria-hidden />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-lg p-3 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground rounded-lg p-3">
              <p className="text-sm">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
