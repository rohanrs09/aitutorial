import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuizQuestions, hasQuestionsForTopic } from '@/lib/quiz-questions';
import { ensureUserSubscription } from '@/lib/subscription/credits';
import type { DifficultyLevel } from '@/lib/quiz-types';

export async function POST(req: NextRequest) {
  try {
    // ═══════════════════════════════════════
    // STEP 1: Authenticate user
    // ═══════════════════════════════════════
    const { userId } = await auth();
    
    if (!userId) {
      console.log('[Quiz API] ❌ Unauthorized - no user ID');
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
    
    console.log('[Quiz API] ═══════════════════════════════════════');
    console.log('[Quiz API] 👤 Authenticated User:', userId);

    // ═══════════════════════════════════════
    // STEP 2: Ensure user has subscription & credits (optional - quiz is free)
    // ═══════════════════════════════════════
    try {
      const subscriptionResult = await ensureUserSubscription(userId);
      if (subscriptionResult.success) {
        console.log('[Quiz API] 💳 Subscription:', subscriptionResult.subscription?.tier);
        console.log('[Quiz API] 💰 Credits:', subscriptionResult.credits?.totalCredits, '- Used:', subscriptionResult.credits?.usedCredits);
      }
    } catch (dbError: any) {
      console.warn('[Quiz API] ⚠️ Database unavailable, continuing without subscription check');
      console.warn('[Quiz API] Error:', dbError.message);
    }
    
    console.log('[Quiz API] ℹ️ Quiz generation is FREE - no credits deducted');

    // ═══════════════════════════════════════
    // STEP 4: Parse and validate request body
    // ═══════════════════════════════════════
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { topic, difficulty, count, focusSubtopics, userContext } = body;

    // Validation
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required and must be a non-empty string' }, { status: 400 });
    }

    const questionCount = count && typeof count === 'number' && count > 0 && count <= 20 ? count : 5;
    const validDifficulties = ['easy', 'medium', 'hard', 'mixed'];
    const selectedDifficulty = difficulty && validDifficulties.includes(difficulty) ? difficulty : 'mixed';

    // ═══════════════════════════════════════
    // STEP 5: Generate quiz using local question bank
    // ═══════════════════════════════════════
    console.log('[Quiz API] 📚 Topic:', topic);
    console.log('[Quiz API] 📊 Difficulty:', selectedDifficulty);
    console.log('[Quiz API] 🔢 Question Count:', questionCount);
    console.log('[Quiz API] ═══════════════════════════════════════');
    
    // Get questions from local bank
    const rawQuestions = getQuizQuestions(topic.trim(), questionCount);
    
    // Filter by difficulty if not mixed
    let filteredRaw = rawQuestions;
    if (selectedDifficulty !== 'mixed') {
      filteredRaw = rawQuestions.filter(q => q.difficulty === selectedDifficulty);
      if (filteredRaw.length < 1) {
        filteredRaw = rawQuestions;
      }
    }

    // Transform to full quiz format
    const questions = filteredRaw.map((q, idx) => ({
      id: `q_${Date.now()}_${idx}`,
      topic: topic.trim(),
      subtopic: topic.trim(),
      question: q.question,
      type: 'multiple-choice' as const,
      difficulty: q.difficulty,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.difficulty === 'easy' ? 5 : q.difficulty === 'medium' ? 10 : 15,
    }));

    console.log(`[Quiz API] ✅ Generated ${questions.length} questions for "${topic}"`);

    return NextResponse.json({
      questions,
      metadata: {
        topic: topic.trim(),
        difficulty: selectedDifficulty,
        count: questions.length,
        generatedAt: new Date().toISOString(),
        difficultyDistribution: {
          easy: questions.filter(q => q.difficulty === 'easy').length,
          medium: questions.filter(q => q.difficulty === 'medium').length,
          hard: questions.filter(q => q.difficulty === 'hard').length,
        },
        generator: 'local-bank',
      },
    });

  } catch (error: any) {
    console.error('[Quiz API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
