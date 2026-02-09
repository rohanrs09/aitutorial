import { NextRequest, NextResponse } from 'next/server';
import { auth, getAdminClient } from '@/lib/auth';

/**
 * GET /api/quiz/history
 * Fetch quiz history for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Quiz History API] Fetching history for user:', userId);

    const supabase = getAdminClient();

    // Fetch quiz sessions from learning_sessions (has quiz_score)
    const { data: sessions, error } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', userId)
      .not('quiz_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Quiz History API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quiz history' },
        { status: 500 }
      );
    }

    // Transform data for frontend
    const quizHistory = sessions?.map(session => ({
      id: session.id,
      sessionId: session.session_id,
      topic: session.topic_name,
      score: session.quiz_score || 0,
      totalQuestions: session.total_messages || 0,
      difficulty: 'mixed', // Default, can be enhanced
      completedAt: new Date(session.ended_at || session.created_at),
      timeSpent: session.duration_minutes ? session.duration_minutes * 60 : 0,
      emotions: session.emotions_detected || [],
      primaryEmotion: session.primary_emotion,
    })) || [];

    console.log('[Quiz History API] Found', quizHistory.length, 'quiz sessions');

    return NextResponse.json({
      success: true,
      quizzes: quizHistory,
      total: quizHistory.length,
    });

  } catch (error: any) {
    console.error('[Quiz History API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
