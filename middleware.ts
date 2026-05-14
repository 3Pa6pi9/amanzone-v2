// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // In a real production app with Firebase, you'd verify a session cookie here.
  // For basic routing protection on the client side, we check for a custom cookie 
  // or rely on the Firebase Auth state listener inside the layout/components.
  
  const hasAccess = request.cookies.has('amanzone-admin-session');

  if (!hasAccess && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/inventory/:path*'],
};