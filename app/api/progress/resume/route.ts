import { isSupabaseConfigured } from '@/lib/supabase';
import { auth, getAdminClient } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/progress/resume
 * Resume user's last session or create a new one
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const topicName = request.nextUrl.searchParams.get('topic');

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

    const supabase = getAdminClient();

    // Use Supabase user ID (UUID format)
    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'completed')
      .order('last_accessed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      // Update last accessed
      await supabase
        .from('learning_progress')
        .upsert(
          {
            session_id: data.session_id,
            user_id: userId,
            topic_name: data.topic_name,
            last_accessed_at: new Date().toISOString(),
          },
          { onConflict: 'session_id' }
        );

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
        session_id: newSessionId,
        user_id: userId,
        topic_name: topicName || 'default',
        status: 'started',
        progress_percentage: 0,
        last_accessed_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

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
