'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { avatarEvents } from '@/lib/utils/avatar-events';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Settings, LogOut, Heart, List, Activity, UserCircle } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function UserAvatar() {
  const { user, loading } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    // Listen for avatar changes
    const unsubscribeAvatarEvents = avatarEvents.subscribe((userId, newAvatarUrl) => {
      if (user && userId === user.id) {
        setProfile(prev =>
          prev
            ? {
                ...prev,
                avatar_url: newAvatarUrl,
              }
            : null
        );
      }
    });

    return () => {
      unsubscribeAvatarEvents();
    };
  }, [user?.id]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, bio, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getDisplayName = () => {
    if (profile?.display_name) {
      return profile.display_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="hidden md:flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Sign In</Link>
        </Button>
        <Button asChild variant="default" size="sm">
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full p-0"
          aria-label={`User menu for ${getDisplayName()}`}
        >
          <Avatar className="h-8 w-8" key={profile?.avatar_url || 'no-avatar'}>
            <AvatarImage
              src={profile?.avatar_url || undefined}
              alt={`${getDisplayName()}'s avatar`}
            />
            <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Profile & Account */}
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        {/* Quick Access Items */}
        <DropdownMenuItem asChild>
          <Link href="/watchlist" className="flex items-center">
            <Heart className="mr-2 h-4 w-4" />
            <span>Watchlist</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/lists" className="flex items-center">
            <List className="mr-2 h-4 w-4" />
            <span>My Lists</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/feed" className="flex items-center">
            <Activity className="mr-2 h-4 w-4" />
            <span>Activity Feed</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Settings */}
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
