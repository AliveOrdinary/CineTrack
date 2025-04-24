// Helper to determine if we're using local or production Supabase
export const isLocalSupabase = () => {
    return process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1') || 
           process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost');
  };
  
  export const logEnvironment = () => {
    console.log(`Using ${isLocalSupabase() ? 'LOCAL' : 'PRODUCTION'} Supabase environment`);
  };