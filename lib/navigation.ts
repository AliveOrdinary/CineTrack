import { 
  Home, 
  Search, 
  Heart, 
  List, 
  Activity, 
  Compass, 
  User, 
  Settings 
} from 'lucide-react';

export interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  requiresAuth?: boolean;
  desktop?: boolean;
  mobile?: boolean;
}

export const navigationItems: NavigationItem[] = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
    description: 'Discover trending content',
    desktop: true,
    mobile: true,
  },
  {
    title: 'Discover',
    href: '/discover',
    icon: Compass,
    description: 'Explore new movies and shows',
    desktop: true,
    mobile: true,
  },
  {
    title: 'Search',
    href: '/search',
    icon: Search,
    description: 'Find specific content',
    desktop: false,
    mobile: true,
  },
  {
    title: 'Feed',
    href: '/feed',
    icon: Activity,
    description: 'See what friends are watching',
    requiresAuth: true,
    desktop: true,
    mobile: true,
  },
  {
    title: 'Watchlist',
    href: '/watchlist',
    icon: Heart,
    description: 'Your saved content',
    requiresAuth: true,
    desktop: true,
    mobile: true,
  },
  {
    title: 'Lists',
    href: '/lists',
    icon: List,
    description: 'Your custom collections',
    requiresAuth: true,
    desktop: true,
    mobile: true,
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
    description: 'Your profile and stats',
    requiresAuth: true,
    desktop: false,
    mobile: true,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Customize your experience',
    requiresAuth: true,
    desktop: false,
    mobile: true,
  },
];

export function getFilteredNavigationItems(
  isAuthenticated: boolean,
  location: 'desktop' | 'mobile' = 'mobile'
): NavigationItem[] {
  return navigationItems.filter(item => {
    // Filter by location (desktop/mobile)
    const locationMatch = location === 'desktop' ? item.desktop : item.mobile;
    if (!locationMatch) return false;

    // Filter by authentication requirement
    if (item.requiresAuth && !isAuthenticated) return false;

    return true;
  });
}