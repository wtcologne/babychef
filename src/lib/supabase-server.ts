import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

type Cookie = {
  name: string;
  value: string;
  options?: Parameters<ReturnType<typeof cookies>['set']>[0];
};

export const supabaseServer = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll() as unknown as Cookie[];
        },
        setAll(cookiesToSet) {
          const cookieStore = cookies();
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
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
          return [] as Cookie[];
        },
        setAll() {
          // no-op for service role client
        }
      }
    }
  );
};
