import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/progress/history
 * Get user's learning history and progress
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        data: [],
        message: 'Supabase not configured',
      });
    }

    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false });

    if (error) {
      console.error('[API] History fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to load history' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const summary = {
      totalSessions: data?.length || 0,
      completedSessions: data?.filter((s: any) => s.status === 'completed').length || 0,
      totalLearningTime: data?.reduce((sum: number, s: any) => {
        const duration = (new Date(s.last_accessed_at).getTime() - new Date(s.started_at).getTime()) / (1000 * 60);
        return sum + duration;
      }, 0) || 0,
      completedTopics: [
        ...new Set(
          data?.filter((s: any) => s.status === 'completed').map((s: any) => s.topic_name) || []
        ),
      ],
    };

    return NextResponse.json({
      success: true,
      data: data || [],
      summary,
    });
  } catch (err) {
    console.error('[API] Error fetching history:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
