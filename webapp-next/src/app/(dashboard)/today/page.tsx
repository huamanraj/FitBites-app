'use client';

import { useAuth } from '@/context/auth-context';
import {
  addFoodEntry,
  deleteEntry,
  estimateCalories,
  FoodEntry,
  getTodayEntries,
} from '@/lib/food-service';
import { DailyGoals, getDailyGoalsForUser } from '@/lib/goals-service';
import { format } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PLACEHOLDERS = [
  '2 roti and dal',
  'Masala dosa',
  'Chicken biryani',
  'Paneer butter masala',
  'Idli sambar',
  'Aloo paratha',
  'Chole bhature',
  'Rajma chawal',
  'Veg pulao',
  'Palak paneer',
  'Fish curry and rice',
  'Poha',
  'Upma',
  'Samosa',
  'Maggi noodles',
];

function ShimmerLine() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="h-[17px] w-32 bg-[#E5E5E5] rounded animate-shimmer" />
      <div className="h-[17px] w-16 bg-[#E5E5E5] rounded animate-shimmer" />
    </div>
  );
}

export default function TodayPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [inputText, setInputText] = useState('');
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingEntries, setPendingEntries] = useState<{ id: string; foodName: string }[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<FoodEntry | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      getTodayEntries(user.$id)
        .then(setEntries)
        .catch(() => {})
        .finally(() => setIsInitLoading(false));
      getDailyGoalsForUser(user.$id).then(setDailyGoals).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorMsg(null), 5000);
  };

  const totalCalories = useMemo(
    () => entries.reduce((sum, e) => sum + e.calories, 0),
    [entries],
  );

  const todayTotals = useMemo(
    () => ({
      calories: entries.reduce((s, e) => s + e.calories, 0),
      protein: entries.reduce((s, e) => s + (e.protein || 0), 0),
      carbs: entries.reduce((s, e) => s + (e.carbs || 0), 0),
      fat: entries.reduce((s, e) => s + (e.fat || 0), 0),
    }),
    [entries],
  );

  const handleSubmit = useCallback(async () => {
    const food = inputText.trim();
    if (!food || !user) return;

    setInputText('');
    setErrorMsg(null);

    const tempId = `pending-${Date.now()}-${Math.random()}`;
    setPendingEntries((prev) => [...prev, { id: tempId, foodName: food }]);

    try {
      const macros = await estimateCalories(food);
      const entry = await addFoodEntry(user.$id, food, macros);
      setPendingEntries((prev) => prev.filter((p) => p.id !== tempId));
      setEntries((prev) => [...prev, entry]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setPendingEntries((prev) => prev.filter((p) => p.id !== tempId));

      if (msg.startsWith('invalid-entry:')) {
        const parts = msg.replace('invalid-entry:', '').split('\n');
        setInputText(food);
        showError(parts.join(' · '));
      } else if (msg.startsWith('network:')) {
        setInputText(food);
        showError('No internet connection. Please try again.');
      } else {
        showError(msg || 'Failed to estimate calories.');
      }
    }
  }, [inputText, user]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteEntry(id);
      setEntries((prev) => prev.filter((e) => e.$id !== id));
      setSelectedEntry(null);
    } catch {
      showError('Failed to delete entry.');
    }
  }, []);

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      {/* Error banner */}
      {errorMsg && (
        <div className="bg-[#FFF3CD] px-[22px] py-2.5 animate-fadeIn">
          <p className="text-[#7A4F00] text-[13px] font-semibold leading-[18px]">
            {errorMsg}
          </p>
        </div>
      )}

      {/* Title row */}
      <div className="flex justify-between items-baseline px-[22px] pt-2.5 pb-3.5">
        <h2 className="text-[26px] font-light text-[#AAAAAA] tracking-[0.2px]">Today</h2>
        <span
          className={`text-[15px] tracking-[0.2px] transition-colors ${
            totalCalories !== 0 ? 'text-[#333333] font-semibold' : 'text-[#BBBBBB]'
          }`}
        >
          {dailyGoals
            ? `${totalCalories} / ${dailyGoals.calories} cal`
            : totalCalories !== 0
              ? `cals  ${totalCalories}`
              : 'cals'}
        </span>
      </div>

      {/* Food list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-[22px] pb-4">
        {isInitLoading ? (
          <>
            <ShimmerLine />
            <ShimmerLine />
            <ShimmerLine />
          </>
        ) : (
          <>
            {entries.map((item) => (
              <div
                key={item.$id}
                onClick={() => setSelectedEntry(selectedEntry?.$id === item.$id ? null : item)}
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-[#FAFAFA] -mx-2 px-2 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-[17px] font-medium text-[#111111] tracking-[-0.2px] truncate">
                    {item.foodName}
                  </span>
                </div>
                <span
                  className={`text-[17px] font-normal tracking-[-0.2px] ml-3 ${
                    item.calories < 0 ? 'text-[#22C55E]' : 'text-[#111111]'
                  }`}
                >
                  {item.calories < 0 ? `${item.calories}` : item.calories}
                </span>
              </div>
            ))}

            {/* Pending entries */}
            {pendingEntries.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <span className="text-[17px] font-medium text-[#111111] tracking-[-0.2px]">
                  {p.foodName}
                </span>
                <div className="h-[17px] w-16 bg-[#E5E5E5] rounded animate-shimmer" />
              </div>
            ))}

            {/* Expanded detail */}
            {selectedEntry && (
              <div className="bg-[#F2F2F7] rounded-2xl p-4 mb-3 animate-fadeIn">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-base font-semibold text-[#111111]">
                    {selectedEntry.foodName}
                  </span>
                  <button
                    onClick={() => handleDelete(selectedEntry.$id)}
                    className="text-[13px] text-[#EF4444] font-semibold hover:opacity-70 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-2xl font-bold text-[#111111] mb-3">
                  {selectedEntry.calories} cal
                </p>

                {/* Macro bars */}
                {(() => {
                  const total = selectedEntry.protein + selectedEntry.carbs + selectedEntry.fat;
                  if (total === 0) return null;
                  return (
                    <div className="space-y-2">
                      <MacroRow label="Protein" value={selectedEntry.protein} color="#EF4444" max={total} />
                      <MacroRow label="Carbs" value={selectedEntry.carbs} color="#3B82F6" max={total} />
                      <MacroRow label="Fat" value={selectedEntry.fat} color="#F97316" max={total} />
                    </div>
                  );
                })()}

                {/* Progress bars if goals exist */}
                {dailyGoals && (
                  <div className="mt-4 pt-3 border-t border-[#DDDDDD] space-y-2">
                    <GoalBar label="Calories" eaten={todayTotals.calories} goal={dailyGoals.calories} color="#111111" />
                    <GoalBar label="Protein" eaten={todayTotals.protein} goal={dailyGoals.protein} color="#EF4444" />
                    <GoalBar label="Carbs" eaten={todayTotals.carbs} goal={dailyGoals.carbs} color="#3B82F6" />
                    <GoalBar label="Fat" eaten={todayTotals.fat} goal={dailyGoals.fat} color="#F97316" />
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className="py-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={PLACEHOLDERS[placeholderIdx]}
                className="w-full text-[17px] text-[#111111] placeholder:text-[#CCCCCC] bg-transparent outline-none py-2"
              />
            </div>
          </>
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
