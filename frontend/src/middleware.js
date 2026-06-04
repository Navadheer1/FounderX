import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token') || request.headers.get('authorization');
  const path = request.nextUrl.pathname;

  // Define protected paths
  const isProtectedPath = path.startsWith('/dashboard');

  // Logic: If trying to access dashboard without token, redirect to login
  // Note: Since we are using localStorage for token in AuthContext, 
  // Next.js middleware (running on edge) cannot access localStorage directly.
  // This is a client-side + server-side hybrid approach.
  // For strict server-side protection, we would need to set cookies on login.
  // For this architecture, we rely on the AuthContext (client-side) for redirects,
  // but we can add basic checks here if we used cookies.
  
  // Since we implemented client-side protection in the Dashboard pages themselves (useEffect redirect),
  // this middleware file acts as a placeholder for future cookie-based enhancements.
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
