'use client';

import { useAuth } from '@/context/auth-context';
import {
  FoodEntry,
  getEntriesForRange,
  getMonthRange,
  getWeekRange,
} from '@/lib/food-service';
import { getDailyGoalsForUser } from '@/lib/goals-service';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

type Period = 'week' | 'month';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('week');
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [goal, setGoal] = useState(2000);

  useEffect(() => {
    if (!user) return;
    getDailyGoalsForUser(user.$id)
      .then((g) => setGoal(g.calories))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const range = period === 'week' ? getWeekRange() : getMonthRange();
    getEntriesForRange(user.$id, range.start, range.end)
      .then(setEntries)
      .catch(() => {});
  }, [user, period]);

  const chartData = useMemo(() => {
    const range = period === 'week' ? getWeekRange() : getMonthRange();
    const days = eachDayOfInterval({
      start: parseISO(range.start),
      end: parseISO(range.end),
    });

    const dayTotals = new Map<string, number>();
    entries.forEach((e) => {
      dayTotals.set(e.date, (dayTotals.get(e.date) || 0) + e.calories);
    });

    return days.map((d) => ({
      label: format(d, period === 'week' ? 'EEE' : 'd'),
      value: Math.max(dayTotals.get(format(d, 'yyyy-MM-dd')) || 0, 0),
    }));
  }, [entries, period]);

  const stats = useMemo(() => {
    const dayTotals = new Map<string, number>();
    entries.forEach((e) => {
      dayTotals.set(e.date, (dayTotals.get(e.date) || 0) + e.calories);
    });
    const values = Array.from(dayTotals.values());
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const best = values.length ? Math.max(...values) : 0;
    return {
      average: Math.round(avg),
      bestDay: Math.round(best),
      totalDays: dayTotals.size,
    };
  }, [entries]);

  const macros = useMemo(() => {
    return entries.reduce(
      (acc, e) => ({
        protein: acc.protein + (e.protein || 0),
        carbs: acc.carbs + (e.carbs || 0),
        fat: acc.fat + (e.fat || 0),
      }),
      { protein: 0, carbs: 0, fat: 0 },
    );
  }, [entries]);

  const maxVal = useMemo(() => Math.max(...chartData.map((d) => d.value), goal * 1.1, 1), [chartData, goal]);

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      <h2 className="text-[18px] font-light text-[#111111] tracking-[0.2px] px-5 py-3">
        Analytics
      </h2>

      <div className="flex-1 overflow-y-auto px-5">
        {/* Tab Switcher */}
        <div className="flex bg-[#F5F5F5] rounded-full p-1 mb-6">
          {(['week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                period === p
                  ? 'bg-white text-[#111111] shadow-sm'
                  : 'text-[#AAAAAA]'
              }`}
            >
              {p === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>

        {/* Bar Chart */}
        <div key={period} className="mb-6 animate-fadeInDown">
          <div className="flex items-end gap-[3px] h-[220px] relative">
            {/* Goal line */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-[#DDDDDD] z-10"
              style={{ bottom: `${(goal / maxVal) * 100}%` }}
            />

            {chartData.map((d, i) => {
              const heightPct = (d.value / maxVal) * 100;
              const isOver = d.value > goal;
              return (
                <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                  <div
                    className="w-full max-w-[40px] rounded-t-md transition-all duration-500"
                    style={{
                      height: `${heightPct}%`,
                      minHeight: d.value > 0 ? '4px' : '0',
                      backgroundColor: isOver ? '#FF6B6B' : '#111111',
                    }}
                  />
                  <span className="text-[10px] text-[#AAAAAA] mt-1.5 truncate w-full text-center">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Avg / Day', value: stats.average },
            { label: 'Best Day', value: stats.bestDay },
            { label: 'Days', value: stats.totalDays },
          ].map((s) => (
            <div key={s.label} className="bg-[#FAFAFA] rounded-2xl p-4 text-center">
              <p className="text-[22px] font-semibold text-[#111111]">{s.value}</p>
              <p className="text-[11px] font-semibold text-[#888888] uppercase tracking-[0.5px] mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Macro Split Bar */}
        {(() => {
          const total = macros.protein + macros.carbs + macros.fat;
          if (total === 0) return null;
          const pPct = (macros.protein / total) * 100;
          const cPct = (macros.carbs / total) * 100;
          const fPct = (macros.fat / total) * 100;
          return (
            <div className="mb-8">
              <div className="flex h-3 rounded-full overflow-hidden gap-[3px]">
                <div style={{ width: `${pPct}%`, backgroundColor: '#EF4444' }} className="rounded-l-full" />
                <div style={{ width: `${cPct}%`, backgroundColor: '#3B82F6' }} />
                <div style={{ width: `${fPct}%`, backgroundColor: '#F97316' }} className="rounded-r-full" />
              </div>
              <div className="flex justify-between mt-2.5">
                {[
                  { label: 'Protein', color: '#EF4444', val: macros.protein },
                  { label: 'Carbs', color: '#3B82F6', val: macros.carbs },
                  { label: 'Fat', color: '#F97316', val: macros.fat },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-xs text-[#888888]">
                      {m.label} {m.val.toFixed(0)}g
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
