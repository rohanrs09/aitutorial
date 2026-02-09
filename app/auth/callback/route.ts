import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard';

  if (code) {
    const cookieStore = request.cookies;
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      console.log('[Auth] User authenticated:', data.user.email);

      // Create or update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          first_name: data.user.user_metadata?.first_name || data.user.user_metadata?.full_name?.split(' ')[0],
          last_name: data.user.user_metadata?.last_name || data.user.user_metadata?.full_name?.split(' ')[1],
          avatar_url: data.user.user_metadata?.avatar_url,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('[Auth] Error creating user profile:', profileError);
      }

      // Initialize subscription and credits
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .upsert({
          id: data.user.id,
          tier: 'starter',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false
        }, { onConflict: 'id' });

      const { error: creditsError } = await supabase
        .from('user_credits')
        .upsert({
          id: data.user.id,
          total_credits: 50,
          used_credits: 0,
          bonus_credits: 0,
          last_reset_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (subError) console.error('[Auth] Error creating subscription:', subError);
      if (creditsError) console.error('[Auth] Error creating credits:', creditsError);

      console.log('[Auth] User setup complete, redirecting to:', redirectTo);
      return response;
    } else {
      console.error('[Auth] Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', request.url));
    }
  }

  // No code provided, redirect to login
  console.log('[Auth] No code provided, redirecting to login');
  return NextResponse.redirect(new URL('/auth/login', request.url));
}
