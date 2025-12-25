import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/progress/save
 * Save or update learning progress
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, topicName, progressData } = body;

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: 'userId and sessionId are required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Progress saved locally (Supabase not configured)',
      });
    }

    // Determine if userId is a UUID or Clerk user ID format
    const upsertData = {
      session_id: sessionId,
      topic_name: topicName,
      ...progressData,
      last_accessed_at: new Date().toISOString(),
    };
    
    // Add the appropriate user ID field based on format
    if (userId.startsWith('user_')) {
      // Clerk user ID format
      upsertData.clerk_user_id = userId;
    } else {
      // UUID format
      upsertData.user_id = userId;
    }
    
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
