import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type ServerCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

export const supabaseServer = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore
            .getAll()
            .map(({ name, value }) => ({ name, value, options: {} as CookieOptions })) as ServerCookie[];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...(options ?? {}) });
          });
        }
      }
    }
  );
};

// Service role client for admin operations
export const supabaseAdmin = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    {
      cookies: {
        getAll() {
          return [] as ServerCookie[];
        },
        setAll() {
          // no-op for service role client
        }
      }
    }
  );
};
