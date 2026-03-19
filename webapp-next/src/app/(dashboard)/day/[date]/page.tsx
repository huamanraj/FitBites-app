'use client';

import { useAuth } from '@/context/auth-context';
import { FoodEntry, getEntriesByDate } from '@/lib/food-service';
import { DailyGoals, getDailyGoalsForUser } from '@/lib/goals-service';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function DayViewPage() {
  const params = useParams();
  const date = params.date as string;
  const { user } = useAuth();

  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user && date) {
      getEntriesByDate(user.$id, date)
        .then(setEntries)
        .catch(() => {})
        .finally(() => setIsLoading(false));
      getDailyGoalsForUser(user.$id).then(setDailyGoals).catch(() => {});
    }
  }, [user, date]);

  const totalCalories = useMemo(
    () => entries.reduce((sum, e) => sum + e.calories, 0),
    [entries],
  );

  const todayTotals = useMemo(
    () =>
      entries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + (e.protein || 0),
          carbs: acc.carbs + (e.carbs || 0),
          fat: acc.fat + (e.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [entries],
  );

  const formattedDate = date ? format(parseISO(date), 'MMMM d, yyyy') : '';

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="flex items-center px-5 py-3">
        <Link
          href="/today"
          className="text-sm text-[#888888] hover:text-[#111111] transition-colors flex items-center gap-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </Link>
      </div>

      {/* Title */}
      <div className="px-5 pt-1 pb-4">
        <h2 className="text-[28px] font-extralight text-[#111111] tracking-[0.3px]">
          {formattedDate}
        </h2>
        <p className={`text-[15px] mt-1 ${totalCalories > 0 ? 'text-[#888888]' : 'text-[#CCCCCC]'}`}>
          {dailyGoals
            ? `${totalCalories} / ${dailyGoals.calories} cal`
            : `${totalCalories} cal`}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[40px] bg-[#E5E5E5] rounded-lg animate-shimmer" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-[#CCCCCC] text-center mt-12">
            No entries for this day.
          </p>
        ) : (
          <div className="space-y-1">
            {entries.map((item) => {
              const isExpanded = expandedId === item.$id;
              const total = item.protein + item.carbs + item.fat;
              return (
                <div key={item.$id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.$id)}
                    className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-[#FAFAFA] transition-colors text-left"
                  >
                    <span className="text-[17px] font-medium text-[#111111] tracking-[-0.2px] truncate flex-1">
                      {item.foodName}
                    </span>
                    <span
                      className={`text-[17px] ml-3 ${
                        item.calories < 0 ? 'text-[#22C55E]' : 'text-[#111111]'
                      }`}
                    >
                      {item.calories < 0 ? `${item.calories}` : item.calories}
                    </span>
                  </button>

                  {isExpanded && total > 0 && (
                    <div className="px-4 pb-3 animate-fadeIn">
                      <div className="space-y-2">
                        <MacroRow label="Protein" value={item.protein} color="#EF4444" max={total} />
                        <MacroRow label="Carbs" value={item.carbs} color="#3B82F6" max={total} />
                        <MacroRow label="Fat" value={item.fat} color="#F97316" max={total} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Progress summary */}
        {dailyGoals && entries.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[#F0F0F0] space-y-2.5">
            <GoalBar label="Calories" eaten={todayTotals.calories} goal={dailyGoals.calories} color="#111111" />
            <GoalBar label="Protein" eaten={todayTotals.protein} goal={dailyGoals.protein} color="#EF4444" />
            <GoalBar label="Carbs" eaten={todayTotals.carbs} goal={dailyGoals.carbs} color="#3B82F6" />
            <GoalBar label="Fat" eaten={todayTotals.fat} goal={dailyGoals.fat} color="#F97316" />
          </div>
        )}
      </div>
    </div>
  );
}

function MacroRow({ label, value, color, max }: { label: string; value: number; color: string; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#888888] w-14">{label}</span>
      <div className="flex-1 h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-[#888888] w-10 text-right">{value.toFixed(1)}g</span>
    </div>
  );
}

function GoalBar({ label, eaten, goal, color }: { label: string; eaten: number; goal: number; color: string }) {
  const pct = Math.min((eaten / goal) * 100, 100);
  const over = eaten > goal;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#888888]">{label}</span>
        <span className={over ? 'text-[#EF4444] font-semibold' : 'text-[#888888]'}>
          {eaten.toFixed(0)} / {goal}
        </span>
      </div>
      <div className="h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: over ? '#EF4444' : color }}
        />
      </div>
    </div>
  );
}
