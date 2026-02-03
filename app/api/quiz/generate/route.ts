import { NextRequest, NextResponse } from 'next/server';
import { generateQuizWithGemini } from '@/lib/gemini-quiz-generator';
import type { DifficultyLevel } from '@/lib/quiz-types';

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { topic, difficulty, count, userId, focusSubtopics, userContext } = body;

    // Validation
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required and must be a non-empty string' }, { status: 400 });
    }

    const questionCount = count && typeof count === 'number' && count > 0 && count <= 20 ? count : 5;
    const validDifficulties = ['easy', 'medium', 'hard', 'mixed'];
    const selectedDifficulty = difficulty && validDifficulties.includes(difficulty) ? difficulty : 'mixed';

    // Check Gemini configuration
    const geminiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL_NAME || 'models/gemini-1.0-pro';
    
    console.log('[Quiz API] ═══════════════════════════════════════');
    console.log('[Quiz API] 🔑 Gemini API Key:', geminiKey ? `Present (${geminiKey.slice(0, 8)}...)` : '❌ MISSING');
    console.log('[Quiz API] 🤖 Gemini Model:', geminiModel);
    console.log('[Quiz API] 📚 Topic:', topic);
    console.log('[Quiz API] 📊 Difficulty:', selectedDifficulty);
    console.log('[Quiz API] 🔢 Question Count:', questionCount);
    console.log('[Quiz API] ═══════════════════════════════════════');
    
    // Validate model configuration
    if (geminiModel !== 'models/gemini-1.0-pro') {
      console.warn('[Quiz API] ⚠️ WARNING: Using non-standard model:', geminiModel);
      console.warn('[Quiz API] ⚠️ Recommended: models/gemini-1.0-pro (v1 stable API)');
    }

    // Generate quiz using Gemini with fallback
    try {
      const result = await generateQuizWithGemini({
        topic: topic.trim(),
        questionCount,
        difficulty: selectedDifficulty as DifficultyLevel | 'mixed',
        subtopics: focusSubtopics,
        userContext: userContext || undefined,
      });

      console.log(`[Quiz API] Successfully generated ${result.questions.length} questions`);

      return NextResponse.json({
        questions: result.questions,
        metadata: {
          topic: result.metadata.topic,
          difficulty: selectedDifficulty,
          count: result.metadata.generatedCount,
          generatedAt: new Date().toISOString(),
          difficultyDistribution: result.metadata.difficultyDistribution,
          subtopicsCovered: result.metadata.subtopicsCovered,
          generator: 'gemini',
        },
      });
    } catch (generationError: any) {
      console.error('[Quiz API] ❌ Gemini generation FAILED');
      console.error('[Quiz API] Error type:', generationError.name);
      console.error('[Quiz API] Error message:', generationError.message);
      console.error('[Quiz API] Full error:', generationError);
      
      // Use fallback questions
      const { generateFallbackQuestions } = await import('@/lib/gemini-quiz-generator');
      const fallbackQuestions = generateFallbackQuestions(
        topic.trim(),
        questionCount,
        selectedDifficulty as DifficultyLevel | 'mixed'
      );

      console.log(`[Quiz API] ⚠️ Using ${fallbackQuestions.length} FALLBACK questions (not dynamic)`);

      return NextResponse.json({
        questions: fallbackQuestions,
        metadata: {
          topic: topic.trim(),
          difficulty: selectedDifficulty,
          count: fallbackQuestions.length,
          generatedAt: new Date().toISOString(),
          difficultyDistribution: {
            easy: fallbackQuestions.filter(q => q.difficulty === 'easy').length,
            medium: fallbackQuestions.filter(q => q.difficulty === 'medium').length,
            hard: fallbackQuestions.filter(q => q.difficulty === 'hard').length,
          },
          subtopicsCovered: [...new Set(fallbackQuestions.map(q => q.subtopic).filter(Boolean))],
          generator: 'fallback',
          warning: 'Using fallback questions. Gemini API unavailable.',
        },
      });
    }

  } catch (error: any) {
    console.error('[Quiz API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
