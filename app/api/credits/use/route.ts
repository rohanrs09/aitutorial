// Credit Usage API Route
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deductCredits, checkAndResetCreditsIfNeeded } from '@/lib/subscription/credits';
import { CREDIT_COSTS } from '@/lib/subscription/types';

// POST - Use credits for an action
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, customAmount, description } = body;

    // Validate action type
    const validActions = Object.keys(CREDIT_COSTS) as (keyof typeof CREDIT_COSTS)[];
    
    let creditCost: number;
    let actionDescription: string;

    if (action && validActions.includes(action)) {
      creditCost = CREDIT_COSTS[action as keyof typeof CREDIT_COSTS];
      actionDescription = description || `Used credits for ${action}`;
    } else if (customAmount && typeof customAmount === 'number' && customAmount > 0) {
      creditCost = customAmount;
      actionDescription = description || 'Custom credit usage';
    } else {
      return NextResponse.json(
        { 
          error: 'Invalid action or amount',
          validActions: validActions,
          creditCosts: CREDIT_COSTS
        },
        { status: 400 }
      );
    }

    // Check and reset credits if needed (new billing period)
    await checkAndResetCreditsIfNeeded(userId);

    // Use credits
    try {
      await deductCredits(userId, creditCost, actionDescription);
    } catch (error: any) {
      return NextResponse.json(
        { 
          error: error.message || 'Insufficient credits',
          requiredCredits: creditCost
        },
        { status: 402 } // Payment Required
      );
    }

    return NextResponse.json({
      success: true,
      creditsUsed: creditCost,
      action: action || 'custom'
    });
  } catch (error) {
    console.error('Use credits error:', error);
    return NextResponse.json(
      { error: 'Failed to use credits' },
      { status: 500 }
    );
  }
}

// GET - Get credit costs info
export async function GET() {
  return NextResponse.json({
    creditCosts: CREDIT_COSTS,
    description: {
      AI_RESPONSE: 'Basic AI text response',
      VOICE_SESSION: 'Full voice tutoring session',
      EMOTION_DETECTION: 'Emotion detection per minute',
      SLIDE_GENERATION: 'Generate learning slides',
      QUIZ_GENERATION: 'Generate quiz questions'
    }
  });
}
