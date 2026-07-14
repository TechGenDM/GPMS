import { auth } from '@/auth';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Define public routes that do not require authentication
  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isPublicRoute = nextUrl.pathname === '/login' || nextUrl.pathname.startsWith('/public');

  if (isApiAuthRoute) {
    return;
  }

  // If attempting to access a protected route while not logged in, redirect to login
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return Response.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  // If logged in and trying to access the login page, redirect to dashboard
  if (isLoggedIn && nextUrl.pathname === '/login') {
    return Response.redirect(new URL('/dashboard', nextUrl));
  }

  // Allow access if logged in or on a public route
  return;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
