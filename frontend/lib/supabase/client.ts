import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@cinetrack/shared/types'; // Assuming your shared types are correctly set up

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ); 