'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Library, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/input-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      {/* Futuristic library-themed background */}
      <div
        className="absolute inset-0 -z-10"
        aria-hidden
      >
        <div className="absolute inset-0 login-futuristic-bg" />
        <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full opacity-20 blur-3xl login-futuristic-orb-1" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full opacity-20 blur-3xl login-futuristic-orb-2" />
        <div className="absolute inset-0 opacity-[0.12] login-futuristic-grid" />
        <div className="absolute inset-0 pointer-events-none login-futuristic-vignette" />
      </div>

      <Card className="login-card w-full max-w-md border-0 bg-white/95 py-8 backdrop-blur-md dark:bg-zinc-900/95">
        <div className="login-card-accent-bar" aria-hidden />
        <CardHeader className="space-y-3 text-center pb-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 ring-1 ring-white/10">
            <Library className="size-6 text-indigo-400 dark:text-indigo-300" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sign in to Read Nest
          </CardTitle>
          <CardDescription className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              readnest.app
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <InputField
              label="Email address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border-zinc-200/80 bg-zinc-50/50 focus-visible:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800/50 dark:focus-visible:ring-indigo-400/30"
            />
            <InputField
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border-zinc-200/80 bg-zinc-50/50 focus-visible:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800/50 dark:focus-visible:ring-indigo-400/30"
            />
            <Button type="submit" className="login-sign-in-btn w-full" disabled={loading}>
              <LogIn className="size-4" />
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
