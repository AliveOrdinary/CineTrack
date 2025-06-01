'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, List, User, Activity, Compass, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activePattern?: RegExp;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    activePattern: /^\/$/,
  },
  {
    href: '/discover',
    label: 'Discover',
    icon: Compass,
    activePattern: /^\/discover/,
  },
  {
    href: '/search',
    label: 'Search',
    icon: Search,
    activePattern: /^\/search/,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    activePattern: /^\/settings/,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: User,
    activePattern: /^\/profile/,
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.activePattern) {
      return item.activePattern.test(pathname);
    }
    return pathname === item.href;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border md:hidden"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-2 text-xs font-medium transition-colors rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                'active:scale-95 transition-transform',
                active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
              aria-label={`${item.label}${active ? ' (current page)' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={cn('h-5 w-5 mb-1', active ? 'text-primary' : 'text-muted-foreground')}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'text-xs leading-none truncate',
                  active ? 'text-primary font-semibold' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
