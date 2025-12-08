// import { NextResponse } from 'next/server';

// export function middleware(request) {
//   return NextResponse.redirect(new URL('/about', request.url));
// }
// the above code is commented out to disable redirection from '/account' to '/about'

import { auth } from '@/app/_lib/auth';

export const middleware = auth;

export const config = {
  matcher: ['/account'],
};
