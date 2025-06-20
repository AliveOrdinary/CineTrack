'use client';

import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { getFilteredNavigationItems } from '@/lib/navigation';

export function DesktopNav() {
  const { user, loading } = useUser();
  const navigationItems = getFilteredNavigationItems(!!user, 'desktop');

  // Don't render anything while loading to prevent layout shift
  if (loading) {
    return <div className="hidden lg:flex items-center gap-6" />;
  }

  return (
    <div className="hidden lg:flex items-center gap-6">
      {navigationItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
          aria-label={item.description}
        >
          {item.title}
        </Link>
      ))}
    </div>
  );
}