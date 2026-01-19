import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: getUser() refreshes the session if valid
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // List of protected routes that require authentication
  const protectedPaths = ['/dashboard', '/settings', '/history', '/scan', '/onboarding'];
  const isProtectedRoute = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !user) {
    // Preserve original URL for post-login redirect
    const redirectTo = encodeURIComponent(request.nextUrl.pathname);
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirectTo', redirectTo);

    // If there was an error getting user (expired/invalid session), add expired flag
    if (error) {
      url.searchParams.set('expired', 'true');
    }

    return NextResponse.redirect(url);
  }

  // Check onboarding status for authenticated users
  if (user && isProtectedRoute) {
    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single()

    const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')

    // If user hasn't completed onboarding (or profile doesn't exist)
    if (!profile?.onboarding_completed) {
      // Allow access to onboarding page
      if (isOnboardingPage) {
        return supabaseResponse
      }
      // Redirect to onboarding from other protected routes
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // If user has completed onboarding but tries to access onboarding page
    if (profile?.onboarding_completed && isOnboardingPage) {
      // Redirect to dashboard
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
