import { isSupabaseConfigured } from '@/lib/supabase';
import { auth, getAdminClient } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/progress/save
 * Save or update learning progress
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, topicName, progressData } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Progress saved locally (Supabase not configured)',
      });
    }

    const supabase = getAdminClient();

    // Use Supabase user ID (UUID format)
    const upsertData = {
      session_id: sessionId,
      user_id: userId,
      topic_name: topicName,
      ...progressData,
      last_accessed_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('learning_progress')
      .upsert(
        upsertData,
        { onConflict: 'session_id' }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error('[API] Save progress error:', error);
      return NextResponse.json(
        { error: 'Failed to save progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('[API] Error saving progress:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
