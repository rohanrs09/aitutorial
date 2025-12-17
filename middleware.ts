import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)',
  '/learn',
  // Public API routes for demo functionality
  '/api/tutor',
  '/api/stt',
  '/api/tts',
  '/api/emotion(.*)',
  '/api/diagram',
  '/api/generate-slides',
]);

// Fallback middleware when Clerk is not configured
function demoMiddleware(req: NextRequest) {
  // Allow all routes in demo mode
  return NextResponse.next();
}

// Export middleware based on configuration
export default isClerkConfigured 
  ? clerkMiddleware(async (auth, req) => {
      // Protect all routes except public ones
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    })
  : demoMiddleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
