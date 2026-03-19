'use client';

import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/today');
    }
  }, [user, isLoading, router]);

  const handleRegister = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(name.trim(), email.trim(), password);
      router.replace('/today');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [name, email, password, register, router]);

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
            Create your account.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          {error && (
            <div className="bg-[#FFF3CD] text-[#7A4F00] text-sm font-semibold rounded-xl px-4 py-2.5 animate-fadeIn">
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full border border-[#EEEEEE] rounded-[14px] px-4 py-3.5 text-base text-[#111111] bg-[#FAFAFA] placeholder:text-[#BBBBBB] outline-none focus:border-[#111111] transition-colors"
          />

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
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            className="w-full border border-[#EEEEEE] rounded-[14px] px-4 py-3.5 text-base text-[#111111] bg-[#FAFAFA] placeholder:text-[#BBBBBB] outline-none focus:border-[#111111] transition-colors"
          />

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-[#111111] text-white font-bold text-base rounded-[14px] py-4 mt-1 min-h-[52px] flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Create Account'
            )}
          </button>

          <Link
            href="/login"
            className="text-center text-sm text-[#AAAAAA] py-1.5 hover:text-[#111111] transition-colors"
          >
            Already have an account?{' '}
            <span className="text-[#111111] font-semibold">Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
