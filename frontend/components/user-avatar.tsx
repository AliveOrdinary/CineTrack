'use client';

import Image from 'next/image';
import { useMemo } from 'react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  email?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Component for displaying user avatars
 * Falls back to user initials if no avatar URL is provided
 */
export default function UserAvatar({ 
  avatarUrl, 
  name, 
  email,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const initials = useMemo(() => {
    if (name) {
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    
    return 'UC'; // User Content
  }, [name, email]);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-xl',
  };
  
  const sizeClass = sizeClasses[size];
  
  if (avatarUrl) {
    return (
      <div className={`relative rounded-full overflow-hidden ${sizeClass} ${className}`}>
        <Image
          src={avatarUrl}
          alt={name || email || 'User avatar'}
          fill
          className="object-cover"
        />
      </div>
    );
  }
  
  // Fallback to initials
  return (
    <div 
      className={`flex items-center justify-center rounded-full bg-blue-600 ${sizeClass} ${className}`}
      aria-label={name || email || 'User avatar'}
    >
      <span className="font-medium text-white">{initials}</span>
    </div>
  );
} 