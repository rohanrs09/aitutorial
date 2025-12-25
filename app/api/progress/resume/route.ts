import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/progress/resume
 * Resume user's last session or create a new one
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const topicName = request.nextUrl.searchParams.get('topic');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        message: 'Supabase not configured',
        session: {
          sessionId: `session_${Date.now()}`,
          userId,
          topic: topicName || 'default',
        },
        source: 'fallback',
      });
    }

    // Find last active session
    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'completed')
      .order('last_accessed_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      // Update last accessed
      await supabase
        .from('learning_progress')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('session_id', data.session_id);

      return NextResponse.json({
        success: true,
        session: data,
        resumed: true,
      });
    }

    // No active session - create new one
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: newSession, error: createError } = await supabase
      .from('learning_progress')
      .insert({
        user_id: userId,
        session_id: newSessionId,
        topic_name: topicName || 'default',
        status: 'started',
        progress_percentage: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error('[API] Error creating session:', createError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: newSession,
      resumed: false,
    });
  } catch (err) {
    console.error('[API] Error in resume:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
