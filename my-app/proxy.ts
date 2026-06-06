import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  const isStudentsRoute = path.startsWith('/students');
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');

  // Verify token if it exists
  const decoded = token ? verifyToken(token) : null;
  const isValidToken = !!decoded;

  if (isStudentsRoute && !isValidToken) {
    // Redirect to login if token is missing or invalid
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      // Clear the invalid token cookie
      response.cookies.delete('token');
    }
    return response;
  }

  if (isAuthRoute && isValidToken) {
    // Redirect logged-in users away from auth pages to students list
    const studentsUrl = new URL('/students', request.url);
    return NextResponse.redirect(studentsUrl);
  }

  return NextResponse.next();
}

// Protect /students and its sub-paths, as well as checking auth pages
export const config = {
  matcher: ['/students/:path*', '/login', '/register'],
};
