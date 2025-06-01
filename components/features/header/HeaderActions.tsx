'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Sun, 
  Moon, 
  Laptop, 
  Palette,
  Shield,
  HelpCircle,
  Settings
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NotificationBell } from '@/components/features/notifications/NotificationBell';
import { useUser } from '@/hooks/use-user';
import { supabase } from '@/lib/supabase/client';

export function HeaderActions() {
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setUserRole(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else {
          setUserRole(data?.role || null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      }
    }

    fetchUserRole();
  }, [user]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
        <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
      </div>
    );
  }

  const ICON_SIZE = 16;

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={ICON_SIZE} className="text-muted-foreground" />;
      case 'dark':
        return <Moon size={ICON_SIZE} className="text-muted-foreground" />;
      case 'system':
        return <Laptop size={ICON_SIZE} className="text-muted-foreground" />;
      default:
        return <Laptop size={ICON_SIZE} className="text-muted-foreground" />;
    }
  };

  // Check if user has moderation access
  const hasModeratorAccess = userRole === 'admin' || userRole === 'moderator' || process.env.NODE_ENV === 'development';

  return (
    <div className="flex items-center gap-1">
      {/* Notifications */}
      <NotificationBell />
      
      {/* Theme Switcher - Quick Access */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Change theme"
          >
            {getThemeIcon()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light" className="flex items-center gap-2">
              <Sun size={ICON_SIZE} className="text-muted-foreground" />
              <span>Light</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark" className="flex items-center gap-2">
              <Moon size={ICON_SIZE} className="text-muted-foreground" />
              <span>Dark</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system" className="flex items-center gap-2">
              <Laptop size={ICON_SIZE} className="text-muted-foreground" />
              <span>System</span>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* More Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="More options"
          >
            <MoreHorizontal size={ICON_SIZE} className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>More Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Moderation Dashboard Link - Only for moderators/admins or development */}
          {hasModeratorAccess && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/moderation" className="flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Moderation</span>
                  {process.env.NODE_ENV === 'development' && (
                    <span className="ml-auto text-xs text-muted-foreground">(Dev)</span>
                  )}
                </Link>
              </DropdownMenuItem>
              {userRole === 'admin' && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                    {process.env.NODE_ENV === 'development' && (
                      <span className="ml-auto text-xs text-muted-foreground">(Dev)</span>
                    )}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuItem asChild>
            <Link href="/help" className="flex items-center">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Support</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 