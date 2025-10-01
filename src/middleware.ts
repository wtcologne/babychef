import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: Request) {
  const url = new URL(req.url);
  const protect = url.pathname.startsWith('/app') || url.pathname.startsWith('/api/recipes');

  console.log('Middleware check:', { pathname: url.pathname, protect });

  if (!protect) return NextResponse.next();

      // Create a response object to handle cookies properly
      const response = NextResponse.next({
        request: {
          headers: req.headers,
        },
      });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          const cookieValue = req.headers.get('cookie')?.match(new RegExp(`${name}=([^;]+)`))?.[1];
          console.log(`Cookie ${name}:`, cookieValue);
          return cookieValue;
        },
            set: (name: string, value: string, options: Record<string, unknown>) => {
              response.cookies.set({
                name,
                value,
                ...options,
              });
            },
            remove: (name: string, options: Record<string, unknown>) => {
              response.cookies.set({
                name,
                value: '',
                ...options,
              });
            },
      },
    }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('Middleware auth check:', { user: user?.email, error, cookies: req.headers.get('cookie') });
  
  if (error) {
    console.error('Middleware auth error:', error);
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  if (!user) {
    console.log('No user in middleware, redirecting to login');
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (url.pathname.includes('/from-photo')) {
    const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', user.id).maybeSingle();
    if (!profile?.is_premium) return NextResponse.redirect(new URL('/premium', req.url));
  }
  
  console.log('Middleware: User authenticated, allowing access');
  return response;
}

// Temporarily disable middleware to debug auth issues
export const config = { matcher: [] };
