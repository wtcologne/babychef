import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const supabaseServer = async () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
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
          return [];
        },
        setAll() {
          // no-op
        }
      }
    }
  );
};
