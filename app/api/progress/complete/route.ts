import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/progress/complete
 * Mark a session as completed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Session marked as completed (local)',
      });
    }

    const { error } = await supabase
      .from('learning_progress')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        progress_percentage: 100,
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('[API] Complete session error:', error);
      return NextResponse.json(
        { error: 'Failed to complete session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session marked as completed',
    });
  } catch (err) {
    console.error('[API] Error completing session:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
