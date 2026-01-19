import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('[Test Supabase] Testing connection...');
    
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        message: 'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
      });
    }

    // Test 1: Check connection
    const { data: testData, error: testError } = await supabase
      .from('learning_sessions')
      .select('id')
      .limit(1);

    if (testError) {
      return NextResponse.json({
        success: false,
        error: testError.message,
        details: testError,
        message: 'Failed to connect to Supabase'
      });
    }

    // Test 2: Check learning_progress table
    const { data: progressData, error: progressError } = await supabase
      .from('learning_progress')
      .select('session_id')
      .limit(1);

    if (progressError) {
      return NextResponse.json({
        success: false,
        error: progressError.message,
        details: progressError,
        message: 'learning_progress table not accessible'
      });
    }

    // Test 3: Check user_profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('clerk_user_id')
      .limit(1);

    if (profileError) {
      return NextResponse.json({
        success: false,
        error: profileError.message,
        details: profileError,
        message: 'user_profiles table not accessible'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      tables: {
        learning_sessions: '✅ Accessible',
        learning_progress: '✅ Accessible',
        user_profiles: '✅ Accessible'
      },
      recordCounts: {
        sessions: testData?.length || 0,
        progress: progressData?.length || 0,
        profiles: profileData?.length || 0
      }
    });

  } catch (error: any) {
    console.error('[Test Supabase] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack
    });
  }
}
