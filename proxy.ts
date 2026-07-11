import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Note: admin and rider surfaces live under real /admin and /rider URL
// segments (not parenthesized route groups) precisely so this middleware can
// gate them by path prefix. Route groups don't appear in the URL, so two
// route groups both containing a `login/page.tsx` would collide on `/login`.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isRiderRoute = pathname.startsWith('/rider') && pathname !== '/rider/login';

  if ((isAdminRoute || isRiderRoute) && !user) {
    const loginPath = isAdminRoute ? '/admin/login' : '/rider/login';
    const redirectUrl = new URL(loginPath, request.url);
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (isAdminRoute || isRiderRoute)) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role;

    if (isAdminRoute && role !== 'admin' && role !== 'dispatcher') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isRiderRoute && role !== 'rider') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/rider/:path*'],
};
