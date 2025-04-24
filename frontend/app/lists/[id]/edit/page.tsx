'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useUser from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@cinetrack/shared/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

type CustomList = Database['public']['Tables']['custom_lists']['Row'];

export default function EditListPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const listId = params.id as string;

  const [listData, setListData] = useState<Partial<CustomList>>({ name: '', description: '', is_public: false });
  const [originalListName, setOriginalListName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial list data
  useEffect(() => {
    if (!listId || !user) {
      // If listId missing or user is still loading/null, wait
      if (!isUserLoading && !user) {
         setError("You must be logged in to edit a list.");
         router.push(`/login?redirect=/lists/${listId}/edit`);
      }
      return; 
    }

    const fetchListData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('custom_lists')
          .select('name, description, is_public, user_id')
          .eq('id', listId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("List not found.");

        // Authorization check: Only the owner can edit
        if (data.user_id !== user.id) {
          throw new Error("You do not have permission to edit this list.");
        }

        setListData({ 
          name: data.name,
          description: data.description || '',
          is_public: data.is_public || false
        });
        setOriginalListName(data.name);

      } catch (err: any) {
        console.error("Error fetching list data for edit:", err);
        setError(err.message || "Failed to load list data.");
        setListData({}); // Clear data on error
        // Optionally redirect if list not found or permission denied
        if (err.message.includes("permission") || err.message.includes("not found")) {
            // Maybe redirect back to list details or lists page
            router.push(`/lists/${listId}`); 
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchListData();
  }, [listId, user, isUserLoading, supabase, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setListData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error on input change
  };

  const handlePublicToggle = (checked: boolean) => {
    setListData(prev => ({ ...prev, is_public: checked }));
  };

  const handleUpdateList = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!listData.name?.trim()) {
        setError("List name cannot be empty.");
        toast({ variant: "destructive", title: "Validation Error", description: "List name is required." });
        return;
    }
    if (!listId || !user) return;

    setIsSaving(true);
    setError(null);

    try {
      const updates: Partial<CustomList> = {
        name: listData.name,
        description: listData.description || null,
        is_public: listData.is_public,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('custom_lists')
        .update(updates)
        .eq('id', listId)
        .eq('user_id', user.id); // Ensure user can only update their own list

      if (updateError) throw updateError;

      toast({ title: "List Updated", description: `"${listData.name}" has been saved.` });
      router.push(`/lists/${listId}`); // Navigate back to list detail page

    } catch (err: any) {
      console.error("Error updating list:", err);
      const message = err.message || "Failed to save changes.";
      setError(message);
      toast({ variant: "destructive", title: "Update Failed", description: message });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render Logic --- 

  if (isLoading || isUserLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/4 mb-6"></div>
        <div className="w-full max-w-2xl mx-auto bg-gray-900 p-6 rounded-lg border border-gray-800">
          <div className="h-8 bg-gray-800 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-800 rounded w-1/5"></div>
            <div className="h-10 bg-gray-800 rounded"></div>
            <div className="h-4 bg-gray-800 rounded w-1/5"></div>
            <div className="h-20 bg-gray-800 rounded"></div>
            <div className="h-10 bg-gray-800 rounded"></div>
            <div className="flex justify-end gap-2 pt-4">
               <div className="h-10 bg-gray-800 rounded w-24"></div>
               <div className="h-10 bg-gray-800 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <Link href={`/lists/${listId}`}>
           <Button variant="outline">Back to List</Button>
        </Link>
      </div>
    );
  }

  if (!originalListName && !isLoading) { // Handle case where list wasn't found or permission denied after loading
       return (
         <div className="container mx-auto px-4 py-8 text-center">
           <p className="text-gray-400 mb-6">Could not load list data for editing.</p>
           <Link href={`/lists`}>
             <Button variant="outline">Back to Lists</Button>
           </Link>
         </div>
       );
  }

  // --- Main Form Content --- 
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={`/lists/${listId}`} className="mb-6 inline-flex items-center text-sm text-blue-400 hover:text-blue-300">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List Details
       </Link>

      <div className="w-full max-w-2xl mx-auto bg-gray-900 p-6 rounded-lg border border-gray-800">
        <h1 className="text-2xl font-bold mb-6">Edit List: {originalListName}</h1>

        <form onSubmit={handleUpdateList} className="space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              name="name" 
              value={listData.name || ''} 
              onChange={handleInputChange} 
              placeholder="e.g., Best Sci-Fi Movies, My Comfort Shows" 
              required 
              maxLength={100}
              className="mt-1"
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={listData.description || ''} 
              onChange={handleInputChange} 
              placeholder="A brief description of your list (optional)" 
              rows={3}
              maxLength={500}
              className="mt-1"
              disabled={isSaving}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-700 p-4">
             <div className="space-y-0.5">
                <Label htmlFor="is_public" className="text-base">
                   Make List Public?
                </Label>
                <p className="text-sm text-muted-foreground">
                   Allow anyone with the link to view this list.
                </p>
             </div>
             <Switch
               id="is_public"
               checked={listData.is_public || false}
               onCheckedChange={handlePublicToggle}
               disabled={isSaving}
             />
           </div>

           {error && (
             <p className="text-sm text-red-500">Error: {error}</p>
           )}

           <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
             <Link href={`/lists/${listId}`}>
               <Button type="button" variant="outline" disabled={isSaving}>Cancel</Button>
             </Link>
             <Button type="submit" disabled={isSaving || isLoading}>
               {isSaving ? 'Saving...' : 'Save Changes'}
             </Button>
           </div>
        </form>
      </div>
    </div>
  );
} 