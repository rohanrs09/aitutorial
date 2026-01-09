'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, AlertCircle, Volume2 } from 'lucide-react';
import { getLocalPreferences, saveLocalPreferences } from '@/lib/user-data';
import { getOrCreateUserProfile, getUserPreferences, updateUserPreferences, isSupabaseConfigured } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function AudioSettingsDemo() {
  const [preferredVoice, setPreferredVoice] = useState('alloy');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const prefs = getLocalPreferences();
    setPreferredVoice(prefs.preferredVoice || 'alloy');
    setVoiceSpeed(typeof prefs.voiceSpeed === 'number' ? prefs.voiceSpeed : 1.0);
  }, []);

  const save = useCallback((next: { preferredVoice?: string; voiceSpeed?: number }) => {
    saveLocalPreferences(next);
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }, 300);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="p-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-lg font-semibold text-white">Audio Settings</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {saveStatus !== 'idle' && (
          <div
            className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
              saveStatus === 'saving' ? 'bg-blue-500/20 text-blue-400' :
              saveStatus === 'saved' ? 'bg-green-500/20 text-green-400' :
              'bg-red-500/20 text-red-400'
            }`}
          >
            {saveStatus === 'saving' && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            {saveStatus === 'saved' && <Check size={16} />}
            {saveStatus === 'error' && <AlertCircle size={16} />}
            <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Error'}</span>
          </div>
        )}

        <section className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center">
              <Volume2 size={18} className="text-gray-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Voice</h2>
              <p className="text-gray-500 text-sm">Customize how the tutor sounds.</p>
            </div>
          </div>

          <div className="py-4 border-b border-white/5">
            <label className="block text-white font-medium mb-2">Preferred voice</label>
            <select
              value={preferredVoice}
              onChange={(e) => {
                const v = e.target.value;
                setPreferredVoice(v);
                save({ preferredVoice: v });
              }}
              className="w-full bg-surface-lighter border border-white/10 rounded-lg px-3 py-2 text-white"
            >
              <option value="alloy">Alloy</option>
              <option value="nova">Nova</option>
              <option value="echo">Echo</option>
              <option value="fable">Fable</option>
            </select>
          </div>

          <div className="py-4">
            <label className="block text-white font-medium mb-2">Voice speed</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0.75}
                max={1.5}
                step={0.05}
                value={voiceSpeed}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setVoiceSpeed(next);
                }}
                onMouseUp={() => save({ voiceSpeed })}
                onTouchEnd={() => save({ voiceSpeed })}
                className="w-full"
              />
              <span className="text-gray-300 text-sm w-14 text-right">{voiceSpeed.toFixed(2)}x</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function AudioSettingsWithClerk() {
  const { user, isLoaded, isSignedIn } = useUser();
  const isAuthenticated = !!isSignedIn;

  const [preferredVoice, setPreferredVoice] = useState('alloy');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const canPersist = useMemo(() => isAuthenticated && !!user?.id && isSupabaseConfigured, [isAuthenticated, user?.id]);

  useEffect(() => {
    const prefs = getLocalPreferences();
    setPreferredVoice(prefs.preferredVoice || 'alloy');
    setVoiceSpeed(typeof prefs.voiceSpeed === 'number' ? prefs.voiceSpeed : 1.0);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!canPersist || !user?.id) return;

    const loadRemote = async () => {
      try {
        const profile = await getOrCreateUserProfile(user.id, {
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          avatarUrl: user.imageUrl || undefined,
        });
        if (!profile) return;

        const prefs = await getUserPreferences(profile.id);
        if (!prefs) return;

        if (prefs.preferred_voice) setPreferredVoice(prefs.preferred_voice);
        if (typeof prefs.voice_speed === 'number') setVoiceSpeed(prefs.voice_speed);
      } catch {
        // ignore - local prefs are already loaded
      }
    };

    loadRemote();
  }, [isLoaded, canPersist, user]);

  const persist = useCallback(async (next: { preferredVoice?: string; voiceSpeed?: number }) => {
    saveLocalPreferences(next);

    setSaveStatus('saving');
    try {
      if (canPersist && user?.id) {
        const profile = await getOrCreateUserProfile(user.id, {
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          avatarUrl: user.imageUrl || undefined,
        });
        if (profile) {
          await updateUserPreferences(profile.id, {
            ...(next.preferredVoice ? { preferred_voice: next.preferredVoice } : {}),
            ...(typeof next.voiceSpeed === 'number' ? { voice_speed: next.voiceSpeed } : {}),
            updated_at: new Date().toISOString(),
          });
        }
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [canPersist, user]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="p-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-lg font-semibold text-white">Audio Settings</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {saveStatus !== 'idle' && (
          <div
            className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
              saveStatus === 'saving' ? 'bg-blue-500/20 text-blue-400' :
              saveStatus === 'saved' ? 'bg-green-500/20 text-green-400' :
              'bg-red-500/20 text-red-400'
            }`}
          >
            {saveStatus === 'saving' && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            {saveStatus === 'saved' && <Check size={16} />}
            {saveStatus === 'error' && <AlertCircle size={16} />}
            <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Error'}</span>
          </div>
        )}

        <section className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center">
              <Volume2 size={18} className="text-gray-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Voice</h2>
              <p className="text-gray-500 text-sm">Customize how the tutor sounds.</p>
            </div>
          </div>

          <div className="py-4 border-b border-white/5">
            <label className="block text-white font-medium mb-2">Preferred voice</label>
            <select
              value={preferredVoice}
              onChange={(e) => {
                const v = e.target.value;
                setPreferredVoice(v);
                persist({ preferredVoice: v });
              }}
              className="w-full bg-surface-lighter border border-white/10 rounded-lg px-3 py-2 text-white"
            >
              <option value="alloy">Alloy</option>
              <option value="nova">Nova</option>
              <option value="echo">Echo</option>
              <option value="fable">Fable</option>
            </select>
          </div>

          <div className="py-4">
            <label className="block text-white font-medium mb-2">Voice speed</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0.75}
                max={1.5}
                step={0.05}
                value={voiceSpeed}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setVoiceSpeed(next);
                }}
                onMouseUp={() => persist({ voiceSpeed })}
                onTouchEnd={() => persist({ voiceSpeed })}
                className="w-full"
              />
              <span className="text-gray-300 text-sm w-14 text-right">{voiceSpeed.toFixed(2)}x</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function AudioSettingsPage() {
  return isClerkConfigured ? <AudioSettingsWithClerk /> : <AudioSettingsDemo />;
}
