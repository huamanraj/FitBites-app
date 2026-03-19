'use client';

import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      router.replace('/today');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [email, password, login, router]);

  return (
    <div className="flex flex-1 min-h-screen items-center justify-center px-7 py-8 animate-fadeIn">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10 animate-fadeInDown">
          <Image
            src="/icon-nobg.png"
            alt="Fit Bites"
            width={160}
            height={160}
            className="mb-2"
            priority
          />
          <h1 className="text-[36px] font-extralight tracking-[2px] text-[#111111]">
            Fit Bites
          </h1>
          <p className="text-sm text-[#BBBBBB] mt-1.5 tracking-[0.3px]">
            Track your calories, effortlessly.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          {error && (
            <div className="bg-[#FFF3CD] text-[#7A4F00] text-sm font-semibold rounded-xl px-4 py-2.5 animate-fadeIn">
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full border border-[#EEEEEE] rounded-[14px] px-4 py-3.5 text-base text-[#111111] bg-[#FAFAFA] placeholder:text-[#BBBBBB] outline-none focus:border-[#111111] transition-colors"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full border border-[#EEEEEE] rounded-[14px] px-4 py-3.5 text-base text-[#111111] bg-[#FAFAFA] placeholder:text-[#BBBBBB] outline-none focus:border-[#111111] transition-colors"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#111111] text-white font-bold text-base rounded-[14px] py-4 mt-1 min-h-[52px] flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>

          <Link
            href="/register"
            className="text-center text-sm text-[#AAAAAA] py-1.5 hover:text-[#111111] transition-colors"
          >
            Don&apos;t have an account?{' '}
            <span className="text-[#111111] font-semibold">Register</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
