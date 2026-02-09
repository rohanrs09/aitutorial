import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/courses',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/reset-password',
  '/api/webhook',
  '/api/webhooks',
];

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/settings',
  '/learn',
];

// Helper to check if route requires authentication
function requiresAuth(pathname: string): boolean {
  return protectedRoutes.some(route => {
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // If OAuth code lands on wrong page (e.g. /?code=xxx), redirect to /auth/callback
  const code = req.nextUrl.searchParams.get('code');
  if (code && pathname !== '/auth/callback') {
    const callbackUrl = new URL('/auth/callback', req.url);
    callbackUrl.searchParams.set('code', code);
    const redirectTo = req.nextUrl.searchParams.get('redirectTo');
    if (redirectTo) callbackUrl.searchParams.set('redirectTo', redirectTo);
    return NextResponse.redirect(callbackUrl);
  }

  // If route requires auth and user is not authenticated, redirect to login
  if (requiresAuth(pathname) && !session) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (session && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
