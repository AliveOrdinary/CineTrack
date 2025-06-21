'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { getFilteredNavigationItems } from '@/lib/navigation';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useUser();
  const navigationItems = getFilteredNavigationItems(!!user, 'mobile');

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
        <SheetHeader className="px-6">
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

        <div className="flex flex-col h-[calc(100vh-8rem)] px-6 py-4">
          <nav className="flex flex-col space-y-1">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                    'touch-manipulation',
                    active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground leading-tight">{item.description}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          
          {!user && !loading && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                Sign in to access your watchlist, lists, and activity feed.
              </p>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 w-full transition-colors touch-manipulation"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
