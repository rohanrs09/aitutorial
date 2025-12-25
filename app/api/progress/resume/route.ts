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

    // Check if userId is a UUID or Clerk user ID format
    let query;
    if (userId.startsWith('user_')) {
      // Clerk user ID format - use clerk_user_id column
      query = supabase
        .from('learning_progress')
        .select('*')
        .eq('clerk_user_id', userId)
        .neq('status', 'completed')
        .order('last_accessed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    } else {
      // UUID format - use user_id column
      query = supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'completed')
        .order('last_accessed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    }
    
    const { data, error } = await query;

    if (data) {
      // Update last accessed
      await supabase
        .from('learning_progress')
        .upsert(
          {
            session_id: data.session_id,
            topic_name: data.topic_name,
            last_accessed_at: new Date().toISOString(),
            ...(userId.startsWith('user_') ? { clerk_user_id: userId } : { user_id: userId }),
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

    const insertData: Record<string, any> = {
      session_id: newSessionId,
      topic_name: topicName || 'default',
      status: 'started',
      progress_percentage: 0,
      last_accessed_at: new Date().toISOString(),
    };

    if (userId.startsWith('user_')) {
      insertData.clerk_user_id = userId;
    } else {
      insertData.user_id = userId;
    }

    const { data: newSession, error: createError } = await supabase
      .from('learning_progress')
      .insert(insertData)
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
