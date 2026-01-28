/**
 * Supabase Middleware Helper
 *
 * Refreshes the auth session on every request by:
 * 1. Reading cookies from the incoming request
 * 2. Calling supabase.auth.getUser() to validate/refresh the token
 * 3. Writing updated cookies to the response
 *
 * This bridges the server-side session (set by server actions) and
 * the client-side session (read by AuthProvider).
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
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
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do NOT use getSession() here.
  // getUser() sends a request to the Supabase Auth server to validate the token,
  // while getSession() only reads from local storage and can be spoofed.
  await supabase.auth.getUser();

  return supabaseResponse;
}
