'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useUser from '@/hooks/useUser';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Users, Flag, LayoutDashboard } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || userData?.role !== 'admin')) {
      console.warn('[AdminLayout] Non-admin user detected, redirecting.');
      router.push('/'); 
    }
  }, [isLoading, user, userData, router]);

  // If still loading or not an admin, render nothing (prevent flashing non-admin content)
  if (isLoading || !userData || userData.role !== 'admin') {
    return null;
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { href: '/admin/users', label: 'Users', icon: <Users className="h-4 w-4 mr-2" /> },
    { href: '/admin/reports', label: 'Reports', icon: <Flag className="h-4 w-4 mr-2" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-12">
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md flex items-center",
                    pathname === item.href 
                      ? "bg-gray-900 text-white" 
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
            
            {/* Mobile navigation */}
            <div className="md:hidden flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "p-2 rounded-md",
                    pathname === item.href 
                      ? "bg-gray-900 text-white" 
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                  title={item.label}
                >
                  {item.icon}
                  <span className="sr-only">{item.label}</span>
                </Link>
              ))}
            </div>
            
            <div className="ml-auto">
              <Link
                href="/"
                className="px-3 py-2 text-sm text-gray-300 hover:text-white"
              >
                Exit Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
} 