'use client';

import { useState, useEffect } from 'react';
import {
  createClient,
  getCustomListWithItems,
  removeItemFromList,
  type CustomListWithItems,
  type ListItem,
} from '@/lib/supabase/client';
import { getMovieDetails, getTvShowDetails } from '@/lib/tmdb/client';
import { TmdbMovieDetails, TmdbTvDetails } from '@/lib/tmdb/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Users,
  Calendar,
  Star,
  Film,
  Tv,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface ListDetailContentProps {
  listId: string;
}

interface ListItemWithDetails extends ListItem {
  title?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

export function ListDetailContent({ listId }: ListDetailContentProps) {
  const [list, setList] = useState<CustomListWithItems | null>(null);
  const [items, setItems] = useState<ListItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItemWithDetails | null>(null);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    loadListData();
  }, [listId]);

  const loadListData = async () => {
    try {
      setIsLoading(true);

      // Check if user is authenticated
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get list data
      const listData = await getCustomListWithItems(listId);
      setList(listData);

      // Check if current user is the owner
      setIsOwner(user?.id === listData.user_id);

      // Enhance items with TMDB data
      if (listData.items && listData.items.length > 0) {
        const enhancedItems = await Promise.all(
          listData.items
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .map(async item => {
              try {
                const details =
                  item.media_type === 'movie'
                    ? await getMovieDetails(item.tmdb_id)
                    : await getTvShowDetails(item.tmdb_id);

                return {
                  ...item,
                  title: details.title || details.name,
                  poster_path: details.poster_path,
                  release_date: details.release_date,
                  first_air_date: details.first_air_date,
                  vote_average: details.vote_average,
                };
              } catch (error) {
                console.error(
                  `Error fetching details for ${item.media_type} ${item.tmdb_id}:`,
                  error
                );
                return {
                  ...item,
                  title: `${item.media_type === 'movie' ? 'Movie' : 'TV Show'} #${item.tmdb_id}`,
                  poster_path: null,
                };
              }
            })
        );
        setItems(enhancedItems);
      }
    } catch (error) {
      console.error('Error loading list:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        notFound();
      }
      toast.error('Failed to load list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (item: ListItemWithDetails) => {
    if (!confirm(`Remove "${item.title}" from this list?`)) {
      return;
    }

    try {
      await removeItemFromList(listId, item.tmdb_id, item.media_type);
      setItems(prev => prev.filter(i => i.id !== item.id));
      toast.success('Item removed from list');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Users className="h-4 w-4" />;
      case 'followers':
        return <Eye className="h-4 w-4" />;
      case 'private':
        return <EyeOff className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'followers':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'private':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">List not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Image */}
      {list.banner_image_url && (
        <div className="aspect-[3/1] relative rounded-lg overflow-hidden">
          <Image
            src={list.banner_image_url}
            alt={`${list.name} banner`}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-3xl font-bold mb-2">{list.name}</h1>
            {list.description && <p className="text-white/90 max-w-2xl">{list.description}</p>}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/lists">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lists
            </Link>
          </Button>
        </div>

        {/* Only show title/description here if no banner */}
        {!list.banner_image_url && (
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{list.name}</h1>
              {list.description && <p className="text-muted-foreground">{list.description}</p>}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="secondary" className={getVisibilityColor(list.visibility!)}>
              {getVisibilityIcon(list.visibility!)}
              <span className="ml-1 capitalize">{list.visibility}</span>
            </Badge>

            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Updated {formatDistanceToNow(new Date(list.updated_at || ''), { addSuffix: true })}
            </div>

            <span>{items.length} items</span>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={`/lists/${listId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit List
                </Link>
              </Button>

              <Button asChild>
                <Link href={`/lists/${listId}/add`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Items
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No items in this list</h3>
          <p className="text-muted-foreground mb-4">
            {isOwner ? 'Add some movies and TV shows to get started' : 'This list is empty'}
          </p>
          {isOwner && (
            <Button asChild>
              <Link href={`/lists/${listId}/add`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Items
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {items.map((item, index) => (
            <Card key={item.id} className="group overflow-hidden">
              <div className="relative aspect-[2/3]">
                {item.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.title || 'Poster'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    {item.media_type === 'movie' ? (
                      <Film className="h-12 w-12 text-muted-foreground" />
                    ) : (
                      <Tv className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                )}

                {/* Overlay with actions */}
                {isOwner && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingItem(item);
                        setEditNotes(item.notes || '');
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRemoveItem(item)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Sort order indicator */}
                {isOwner && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                )}
              </div>

              <CardContent className="p-3">
                <div className="space-y-2">
                  <Link
                    href={`/${item.media_type}/${item.tmdb_id}`}
                    className="block hover:text-primary transition-colors"
                  >
                    <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
                  </Link>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {item.media_type === 'movie' ? (
                        <Film className="h-3 w-3" />
                      ) : (
                        <Tv className="h-3 w-3" />
                      )}
                      <span className="capitalize">{item.media_type}</span>
                    </div>

                    {item.vote_average && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{item.vote_average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {item.release_date || item.first_air_date ? (
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.release_date || item.first_air_date!).getFullYear()}
                    </p>
                  ) : null}

                  {item.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.notes}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Item Notes Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Add your notes about this item..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement update item notes
                  setEditingItem(null);
                  toast.success('Notes updated');
                }}
              >
                Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
