'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, Search, Heart, List, Activity, Compass, User, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
    description: 'Discover trending content',
  },
  {
    title: 'Discover',
    href: '/discover',
    icon: Compass,
    description: 'Explore new movies and shows',
  },
  {
    title: 'Search',
    href: '/search',
    icon: Search,
    description: 'Find specific content',
  },
  {
    title: 'Feed',
    href: '/feed',
    icon: Activity,
    description: 'See what friends are watching',
  },
  {
    title: 'Watchlist',
    href: '/watchlist',
    icon: Heart,
    description: 'Your saved content',
  },
  {
    title: 'My Lists',
    href: '/lists',
    icon: List,
    description: 'Your custom collections',
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
    description: 'Your profile and stats',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Customize your experience',
  },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 pr-0">
        <SheetHeader>
          <SheetTitle className="text-left">
            <Link
              href="/"
              className="text-xl font-bold text-primary"
              onClick={() => setOpen(false)}
            >
              CineTrack
            </Link>
          </SheetTitle>
        </SheetHeader>

        <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-2">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                    active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
