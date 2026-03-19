'use client';

import { useAuth } from '@/context/auth-context';
import { getHistoryDays } from '@/lib/food-service';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const HISTORY_PAGE_SIZE = 7;
const NAV_ITEMS = [
  { href: '/today', label: 'Today' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/goals', label: 'Goals' },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [history, setHistory] = useState<{ date: string; totalCalories: number }[]>([]);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    if (user) {
      getHistoryDays(user.$id, 30).then(setHistory).catch(() => {});
    }
  }, [user]);

  const handleLogout = useCallback(async () => {
    if (!confirm('Are you sure you want to logout?')) return;
    await logout();
    router.replace('/login');
  }, [logout, router]);

  const visibleHistory = history.slice(0, historyPage * HISTORY_PAGE_SIZE);
  const hasMore = visibleHistory.length < history.length;

  return (
    <div className="flex flex-col h-full bg-white w-[280px] min-w-[280px]">
      <div className="flex-1 overflow-y-auto px-[22px] pt-8 pb-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-9">
          <Image src="/icon-nobg.png" alt="Fit Bites" width={52} height={52} />
          <span className="text-[32px] font-extralight tracking-[2px] text-[#111111]">
            Fit Bites
          </span>
        </div>

        {/* Nav */}
        <nav className="mb-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`block py-2.75 px-1 rounded-lg text-[20px] font-normal transition-colors hover:bg-[#FAFAFA] ${
                  isActive ? 'text-[#111111] font-semibold' : 'text-[#111111]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* History */}
        <div className="mt-5">
          <h3 className="text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-[1.2px] mb-1.5 px-1">
            History
          </h3>
          {history.length === 0 && (
            <p className="text-sm text-[#CCCCCC] py-2 px-1">No entries yet.</p>
          )}
          {visibleHistory.map((day) => (
            <Link
              key={day.date}
              href={`/day/${day.date}`}
              onClick={onClose}
              className="flex justify-between items-center py-[7px] px-1 rounded-md hover:bg-[#FAFAFA] transition-colors"
            >
              <span className="text-sm text-[#333333]">
                {format(parseISO(day.date), 'MMM dd')}
              </span>
              <span className="text-[13px] text-[#AAAAAA]">
                {day.totalCalories} cal
              </span>
            </Link>
          ))}
          {hasMore && (
            <button
              onClick={() => setHistoryPage((p) => p + 1)}
              className="py-2.5 px-1 text-[13px] text-[#AAAAAA] font-semibold hover:text-[#111111] transition-colors"
            >
              Show more
            </button>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-[#EEEEEE] px-[22px] pt-4 pb-6">
        <p className="text-[13px] font-semibold text-[#AAAAAA] mb-2.5 truncate">
          {user?.name || 'User'}
        </p>
        <Link
          href="/settings"
          onClick={onClose}
          className="block py-[9px] rounded-md text-[15px] font-semibold text-[#111111] hover:bg-[#FAFAFA] transition-colors"
        >
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="block py-[9px] rounded-md text-[15px] font-semibold text-[#EF4444] hover:bg-[#FFF5F5] transition-colors w-full text-left"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0 border-r border-[#EEEEEE]">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full animate-slideIn">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center px-5 py-3 border-b border-[#F0F0F0]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 hover:opacity-60 transition-opacity"
            aria-label="Open menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 7H21" stroke="#555555" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 17H21" stroke="#555555" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
