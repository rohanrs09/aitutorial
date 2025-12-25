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

    // If userId is provided, use it to ensure we're updating the right user's session
    let updateQuery = supabase
      .from('learning_progress')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        progress_percentage: 100,
      })
      .eq('session_id', sessionId);
      
    if (userId) {
      // Check if userId is a UUID or Clerk user ID format
      if (userId.startsWith('user_')) {
        // Clerk user ID format - use clerk_user_id column
        updateQuery = updateQuery.eq('clerk_user_id', userId);
      } else {
        // UUID format - use user_id column
        updateQuery = updateQuery.eq('user_id', userId);
      }
    }
    
    const { error } = await updateQuery;

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
