'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

type HistoryItem = {
  session_id: string;
  topic_name: string;
  progress_percentage?: number;
  status?: string;
  last_accessed_at?: string;
  created_at?: string;
};

function timeAgo(dateString?: string) {
  if (!dateString) return '';
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

function HistoryDemoPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai_tutor_session_history');
      const history = raw ? JSON.parse(raw) : [];
      const mapped: HistoryItem[] = (history || []).map((s: any) => ({
        session_id: s.id,
        topic_name: s.topicName,
        progress_percentage: 100,
        status: s.score != null ? 'completed' : 'in_progress',
        created_at: s.date,
        last_accessed_at: s.date,
      }));
      setItems(mapped);
    } catch {
      setItems([]);
    }
  }, []);

  return (
    <HistoryList title="Past Sessions" items={items} emptyHint="No sessions saved yet. Complete a session to see it here." />
  );
}

function HistoryClerkPage() {
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/progress/history?userId=${encodeURIComponent(userId)}`);
        const json = await res.json();
        const data = (json?.data || []) as any[];
        const mapped: HistoryItem[] = data.map(s => ({
          session_id: s.session_id,
          topic_name: s.topic_name,
          progress_percentage: s.progress_percentage,
          status: s.status,
          last_accessed_at: s.last_accessed_at,
          created_at: s.created_at,
        }));
        setItems(mapped);
      } catch {
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isLoaded, userId]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <HistoryList
      title="Past Sessions"
      items={items}
      emptyHint={isLoading ? 'Loading...' : 'No sessions found yet.'}
    />
  );
}

function HistoryList({
  title,
  items,
  emptyHint,
}: {
  title: string;
  items: HistoryItem[];
  emptyHint: string;
}) {
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = new Date(a.last_accessed_at || a.created_at || 0).getTime();
      const db = new Date(b.last_accessed_at || b.created_at || 0).getTime();
      return db - da;
    });
  }, [items]);

  return (
    <div className="min-h-screen bg-surface">
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="p-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-lg font-semibold text-white">{title}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {sorted.length === 0 ? (
          <div className="card p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400">{emptyHint}</p>
            <div className="mt-5">
              <Link href="/learn" className="btn-primary text-sm inline-flex justify-center">
                Start a session
              </Link>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="space-y-2">
              {sorted.map((s) => (
                <Link key={s.session_id} href={`/history/${encodeURIComponent(s.session_id)}`}>
                  <div className="flex items-center justify-between py-4 border-b border-white/5 cursor-pointer hover:bg-white/5 -mx-4 px-4 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center">
                        <BookOpen size={18} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{s.topic_name || 'Unknown Topic'}</p>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Clock size={14} />
                          <span>{timeAgo(s.last_accessed_at || s.created_at)}</span>
                          {typeof s.progress_percentage === 'number' && (
                            <span className="ml-2 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-xs">
                              {Math.round(s.progress_percentage)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-500" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function HistoryPage() {
  return isClerkConfigured ? <HistoryClerkPage /> : <HistoryDemoPage />;
}
