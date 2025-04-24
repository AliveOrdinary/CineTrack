"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useUser from '@/hooks/useUser';
import UserAvatar from './user-avatar';

// Import Shadcn UI components & Icons
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ChevronDown } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export default function Header() {
  const { user, userData, signOut, isLoading } = useUser();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      console.log('Header: Sign out initiated, navigating to home page');
      router.push('/');
    } catch (error) {
      console.error('Header - Sign out error:', error);
      router.push('/');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="border-b border-gray-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-white">
          Cine<span className="text-blue-500">Track</span>
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link href="/lists" className="hover:text-blue-400 transition-colors">
            Lists
          </Link>
          <Link href="/movies" className="hover:text-blue-400 transition-colors">
            Movies
          </Link>
          <Link href="/tv" className="hover:text-blue-400 transition-colors">
            TV Shows
          </Link>
          <Link href="/library" className="hover:text-blue-400 transition-colors">
            Library
          </Link>
        </nav>
        
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/search" passHref>
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          </Link>
          
          {isLoading ? (
            <Skeleton className="h-10 w-24 rounded-md" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <UserAvatar 
                    avatarUrl={userData?.avatar_url}
                    name={userData?.display_name}
                    email={user.email}
                    size="sm"
                  />
                  <span className="hidden md:inline">{userData?.display_name || user.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                   <UserAvatar 
                      avatarUrl={userData?.avatar_url}
                      name={userData?.display_name}
                      email={user.email}
                      size="sm"
                    />
                   <div>
                      <p className="font-medium">{userData?.display_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                   </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Your Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/library">Your Library</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/lists">Your Lists</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                   <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="text-red-500 focus:text-red-400 focus:bg-red-900/10 cursor-pointer"
                >
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" passHref>
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
} 