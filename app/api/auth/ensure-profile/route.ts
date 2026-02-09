import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureUserSubscription } from '@/lib/subscription/credits';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure subscription and credits exist (creates only if missing, preserves existing)
    const result = await ensureUserSubscription(userId);

    if (!result.success) {
      console.error('[EnsureProfile] Failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to ensure profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: result.subscription ? {
        tier: result.subscription.tier,
        status: result.subscription.status,
      } : null,
      credits: result.credits ? {
        total: result.credits.totalCredits,
        used: result.credits.usedCredits,
        bonus: result.credits.bonusCredits,
      } : null,
    });
  } catch (error: any) {
    console.error('[EnsureProfile] Error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
