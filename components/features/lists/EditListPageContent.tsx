'use client';

import { useState, useEffect } from 'react';
import {
  createClient,
  getCustomListWithItems,
  type CustomListWithItems,
  type CustomList,
} from '@/lib/supabase/client';
import { EditListDialog } from './EditListDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';

interface EditListPageContentProps {
  listId: string;
}

export function EditListPageContent({ listId }: EditListPageContentProps) {
  const [list, setList] = useState<CustomListWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const router = useRouter();

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

      if (!user) {
        toast.error('Please log in to edit lists');
        return;
      }

      // Get list data
      const listData = await getCustomListWithItems(listId);
      setList(listData);

      // Check if current user is the owner
      setIsOwner(user.id === listData.user_id);

      if (user.id !== listData.user_id) {
        toast.error('You can only edit your own lists');
        return;
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

  const handleUpdate = (updatedList: CustomList) => {
    setList(prev => (prev ? { ...prev, ...updatedList } : null));
    // Redirect back to the list after successful update
    router.push(`/lists/${listId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded animate-pulse" />
        <div className="h-12 bg-muted rounded animate-pulse" />
        <div className="h-24 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!list || !isOwner) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {!list ? 'List not found.' : 'You can only edit your own lists.'}
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/lists">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lists
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/lists/${listId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Edit List</h1>
        <p className="text-muted-foreground">
          Update your list details, banner image, and settings
        </p>
      </div>

      {/* Edit Dialog - Always open on this page */}
      <EditListDialog
        list={list as CustomList}
        isOpen={true}
        onOpenChange={open => {
          if (!open) {
            // If dialog is closed, redirect back to the list
            router.push(`/lists/${listId}`);
          }
        }}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
