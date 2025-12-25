// ==========================================
// SUPABASE DEBUG UTILITY
// ==========================================
// Usage in browser console:
// import { debugSupabase } from '@/lib/debug-supabase'
// await debugSupabase()

import { checkSupabaseHealth, validateSupabaseConnection, isSupabaseConfigured } from './supabase';

export async function debugSupabase() {
  console.log('========== SUPABASE DEBUG REPORT ==========\n');

  // 1. Configuration Check
  console.log('📋 CONFIGURATION:');
  console.log('- Supabase Configured:', isSupabaseConfigured);
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET');

  // 2. Connection Check
  console.log('\n🔗 CONNECTION:');
  const validation = await validateSupabaseConnection();
  console.log('- Is Connected:', validation.isConnected);
  console.log('- Tables Exist:', validation.tablesExist ?? 'Unknown');
  if (validation.error) {
    console.log('- Error:', validation.error);
  }

  // 3. Health Check
  console.log('\n❤️  HEALTH STATUS:');
  const health = await checkSupabaseHealth();
  console.log('- Status:', health.status.toUpperCase());
  console.log('- Configured:', health.configured);
  console.log('- Connected:', health.connected);
  console.log('- Tables Exist:', health.tablesExist);
  if (health.details.error) {
    console.log('- Details:', health.details.error);
  }

  // 4. localStorage Check
  console.log('\n💾 LOCAL STORAGE:');
  const currentSession = localStorage.getItem('ai_tutor_current_session');
  const sessionHistory = localStorage.getItem('ai_tutor_session_history');
  console.log('- Current Session:', currentSession ? '✅ Stored' : '❌ Empty');
  if (currentSession) {
    const session = JSON.parse(currentSession);
    console.log('  - Session ID:', session.sessionId);
    console.log('  - Topic:', session.topicName);
    console.log('  - Started:', new Date(session.startedAt).toLocaleTimeString());
    console.log('  - Messages:', session.messages?.length || 0);
  }
  console.log('- Session History:', sessionHistory ? `✅ ${JSON.parse(sessionHistory).length} sessions` : '❌ Empty');

  // 5. Recommendations
  console.log('\n📝 RECOMMENDATIONS:');
  if (!isSupabaseConfigured) {
    console.log('1. Add environment variables to .env.local:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL=your_url');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
    console.log('2. Restart dev server: npm run dev');
  } else if (!validation.isConnected) {
    console.log('1. Check Supabase URL is correct');
    console.log('2. Check internet connection');
    console.log('3. Verify Supabase project is running');
  } else if (!validation.tablesExist) {
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Copy all content from migrations/001_create_tables.sql');
    console.log('3. Paste and run in SQL Editor');
    console.log('4. Refresh browser');
  } else {
    console.log('✅ Everything looks good!');
  }

  console.log('\n==========================================\n');
}

// Export for debugging in browser
if (typeof window !== 'undefined') {
  (window as any).debugSupabase = debugSupabase;
}
