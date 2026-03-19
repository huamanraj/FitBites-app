'use client';

import { useAuth } from '@/context/auth-context';
import { updateName } from '@/lib/auth';
import { useCallback, useState } from 'react';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const trimmed = displayName.trim();
      if (trimmed !== user?.name) {
        await updateName(trimmed);
        updateUser({ name: trimmed });
      }
      alert('Settings saved!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save settings.';
      alert(message);
    } finally {
      setSaving(false);
    }
  }, [displayName, user, updateUser]);

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      <h2 className="text-[18px] font-light text-[#111111] tracking-[0.2px] px-5 py-3">
        Settings
      </h2>

      <div className="flex-1 px-6 pt-8">
        <label className="text-xs font-semibold text-[#888888] uppercase tracking-[1px] mb-2 block">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="w-full border-b border-[#E0E0E0] py-3 text-base text-[#000000] placeholder:text-[#AAAAAA] outline-none focus:border-[#111111] transition-colors bg-transparent"
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#111111] text-white font-bold text-base rounded-full py-4 mt-9 flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <p className="text-center text-[#CCCCCC] text-xs pb-6 mt-auto">
        Fit Bites v1.0.0
      </p>
    </div>
  );
}
