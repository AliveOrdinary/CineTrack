'use client';

import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
// Import icons for social providers, e.g., from lucide-react
// import { ChromeIcon, GithubIcon } from 'lucide-react';

export default function SocialLogins() {
  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, // Your auth callback page
        },
      });
      if (error) {
        console.error(`Error logging in with ${provider}:`, error.message);
        // TODO: Display error to user
      }
    } catch (error) {
      console.error(`Unexpected error logging in with ${provider}:`, error);
      // TODO: Display error to user
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={() => handleOAuthLogin('google')}>
        {/* <ChromeIcon className="mr-2 h-4 w-4" /> */}
        <span className="mr-2 h-4 w-4"> G </span> {/* Placeholder Icon */}
        Google
      </Button>
      <Button variant="outline" className="w-full" onClick={() => handleOAuthLogin('github')}>
        {/* <GithubIcon className="mr-2 h-4 w-4" /> */}
        <span className="mr-2 h-4 w-4">GH</span> {/* Placeholder Icon */}
        GitHub
      </Button>
    </div>
  );
}
