import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// This function is specifically for Route Handlers and Server Components
// where `cookies()` from `next/headers` is available and provides a synchronous API.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Errors can occur in Server Components if `set` is called after streaming has started.
            // This can usually be ignored if middleware handles session refresh.
            console.warn(
              'Supabase server client: Failed to set cookie in Server Component/Route Handler. Error:',
              error
            );
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options }); // `remove` is often implemented by setting an empty value
          } catch (error) {
            // Similar to `set`, errors can occur.
            console.warn(
              'Supabase server client: Failed to remove cookie in Server Component/Route Handler. Error:',
              error
            );
          }
        },
      },
    }
  );
}
