'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users } from 'lucide-react';
import { searchUsers, type UserWithFollowStatus } from '@/lib/supabase/client';
import { FollowButton } from './FollowButton';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';

interface UserSearchProps {
  placeholder?: string;
  className?: string;
}

interface SearchUserCardProps {
  user: UserWithFollowStatus;
}

function SearchUserCard({ user }: SearchUserCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>{user.display_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/profile/${user.id}`} className="font-medium hover:underline">
                  {user.display_name || 'User'}
                </Link>

                {user.is_followed_by && (
                  <Badge variant="secondary" className="text-xs">
                    Follows you
                  </Badge>
                )}

                {user.is_following && (
                  <Badge variant="outline" className="text-xs">
                    Following
                  </Badge>
                )}
              </div>

              {user.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
              )}

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{user.followers_count || 0} followers</span>
                <span>{user.following_count || 0} following</span>
                {user.created_at && (
                  <span>
                    Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <FollowButton userId={user.id} size="sm" />
        </div>
      </CardContent>
    </Card>
  );
}

export function UserSearch({
  placeholder = 'Search for users to follow...',
  className,
}: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserWithFollowStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const results = await searchUsers(searchQuery);
      setUsers(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  return (
    <div className={className}>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                  <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && hasSearched && users.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No users found</h3>
            <p className="text-muted-foreground">
              Try searching with a different name or username.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && users.length > 0 && (
        <div className="space-y-3">
          {users.map(user => (
            <SearchUserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      {!hasSearched && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Discover Users</h3>
            <p className="text-muted-foreground">
              Search for users by name to start following them and see their activity.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
