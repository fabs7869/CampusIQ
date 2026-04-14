import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;
  const path = request.nextUrl.pathname;

  const isAuthRoute = path === '/login' || path === '/signup';
  const isDashboardRoute = path.startsWith('/dashboard');
  const isAdminRoute = path.startsWith('/dashboard/admin');
  const isFacultyRoute = path.startsWith('/dashboard/faculty');

  // If trying to access dashboard without token, redirect to login
  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access auth routes with token, redirect to dashboard based on role
  if (isAuthRoute && token) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url));
    } else if (role === 'faculty') {
      return NextResponse.redirect(new URL('/dashboard/faculty', request.url));
    } else {
      // Students don't have a web dashboard in this architecture
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Role-based protection for dashboards
  if (isDashboardRoute && token) {
    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/faculty', request.url));
    }
    if (isFacultyRoute && role !== 'faculty' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url)); // Students fallback
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
