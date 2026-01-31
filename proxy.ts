/**
 * Next.js 16 Proxy (replaces middleware.ts)
 *
 * Handles:
 * 1. Session refresh on every request
 * 2. Route protection - redirects unauthenticated users to login
 *
 * Protected routes: /dashboard, /scan/*, /history, /settings
 * Public routes: /, /auth/*, /privacy-policy, /terms-of-service, /api/*
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/scan', '/history', '/settings'];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create Supabase client for session management
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session (validates token with Supabase server)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If accessing protected route without auth, redirect to login
  if (isProtectedRoute(pathname) && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated user is on login/signup, redirect to dashboard
  if (user && (pathname === '/auth/login' || pathname === '/auth/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If authenticated user is on landing page, redirect to dashboard
  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
