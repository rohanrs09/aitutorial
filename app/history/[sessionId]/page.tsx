'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, BookOpen, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type Msg = {
  id: string;
  role: string;
  content: string;
  created_at?: string;
  timestamp?: string;
};

export default function HistoryDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ? decodeURIComponent(params.sessionId) : '';

  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Session details are only available with Supabase enabled.');
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: qErr } = await supabase
          .from('conversation_messages')
          .select('id, role, content, created_at, timestamp')
          .eq('session_id', sessionId)
          .order('timestamp', { ascending: true });

        if (qErr) {
          setError(qErr.message);
          setMessages([]);
          return;
        }

        setMessages((data || []) as any);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [sessionId]);

  const title = useMemo(() => sessionId ? `Session: ${sessionId}` : 'Session', [sessionId]);

  return (
    <div className="min-h-screen bg-surface">
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/history" className="p-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-lg font-semibold text-white">Session Details</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="card mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center">
              <BookOpen size={18} className="text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold truncate">{title}</p>
              <p className="text-gray-500 text-sm">Conversation messages</p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="card p-8 text-center text-gray-400">Loading messages...</div>
        )}

        {error && !isLoading && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-400">Could not load session</p>
              <p className="text-sm text-red-300/80">{error}</p>
            </div>
          </div>
        )}

        {!error && !isLoading && (
          <div className="card">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                No messages found for this session.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {messages.map((m) => (
                  <div key={m.id} className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                        {m.role}
                      </span>
                      <span className="text-xs text-gray-500">
                        {m.timestamp || m.created_at ? new Date((m.timestamp || m.created_at) as string).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-white whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
