'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useUser from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@cinetrack/shared/types';
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger, 
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react'; // Icons
import { getMovieDetails, getTvDetails, getImageUrl as getTmdbImageUrl, search as searchTmdb } from '@/services/tmdb';
import { MovieDetails, TVDetails, SearchResult, MediaType } from '@/types/tmdb';
import MediaCard from '@/components/media-card'; // Import MediaCard
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"; // Import Input
import Image from 'next/image'; // Import Image for search results
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import { cn } from "@/lib/utils"; // Import cn utility

// Define types for list and its items (can be refined later)
type CustomList = Database['public']['Tables']['custom_lists']['Row'];
type ListItem = Database['public']['Tables']['list_items']['Row']; 

// New type combining Supabase item data with TMDB details
type DetailedListItem = ListItem & {
  tmdbData?: MovieDetails | TVDetails | null; // Use MovieDetails/TVDetails types
};

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast(); // Initialize toast

  const listId = params.id as string;

  const [list, setList] = useState<CustomList | null>(null);
  const [detailedItems, setDetailedItems] = useState<DetailedListItem[]>([]); // State for combined data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // State for delete dialog
  const [isDeleting, setIsDeleting] = useState(false); // State for delete loading
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false); // State for Add Item modal

  // State for Add Item Modal
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [addItemError, setAddItemError] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);

  useEffect(() => {
    if (!listId) {
      setError("List ID not found.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch list details first
        const { data: listData, error: listError } = await supabase
          .from('custom_lists')
          .select('*, users (id, display_name)') // Fetch owner info too
          .eq('id', listId)
          .single();

        if (listError) throw listError;
        if (!listData) throw new Error("List not found.");

        // Check permissions
        const isOwner = user?.id === listData.user_id;
        if (!listData.is_public && !isOwner && !isUserLoading) {
            // If still loading user, wait, otherwise deny access
            if (!isUserLoading){
                 throw new Error("You do not have permission to view this list.");
            } else {
                // Postpone final decision until user loading finishes
                // This might cause a flicker, could be improved
                console.log("Waiting for user session before checking permissions...")
            }
        }

        // Fetch list items if access is granted (or likely granted)
        const { data: itemData, error: itemError } = await supabase
          .from('list_items')
          .select('*') // Select basic item data for now
          .eq('list_id', listId)
          .order('sort_order', { ascending: true });

        if (itemError) throw itemError;

        setList(listData as CustomList);
        setCanEdit(isOwner); // Set edit permissions

        // --- Fetch TMDB details for each item --- 
        if (itemData && itemData.length > 0) {
           console.log(`Fetching TMDB details for ${itemData.length} items...`);
           // Fetch details based on media_type
           const tmdbPromises = itemData.map(item => {
              if (item.media_type === 'movie') {
                 return getMovieDetails(item.tmdb_id)
                          .catch((err: Error) => {
                              console.error(`Failed to fetch TMDB movie details for ID ${item.tmdb_id}:`, err);
                              return null; // Return null on error
                          });
              } else if (item.media_type === 'tv') {
                 return getTvDetails(item.tmdb_id)
                          .catch((err: Error) => {
                              console.error(`Failed to fetch TMDB TV details for ID ${item.tmdb_id}:`, err);
                              return null; // Return null on error
                          });
              } else {
                  console.warn(`Unsupported media type for TMDB fetch: ${item.media_type}`);
                  return Promise.resolve(null); // Resolve immediately with null for unsupported types
              }
           });

           const tmdbResults = await Promise.all(tmdbPromises);
           
           const combinedItems: DetailedListItem[] = itemData.map((item, index) => ({
              ...item,
              tmdbData: tmdbResults[index] as MovieDetails | TVDetails | null // Assign fetched data
           }));
           
           console.log("Combined items with TMDB data:", combinedItems);
           setDetailedItems(combinedItems);
        } else {
            setDetailedItems([]); // Set empty if no items from Supabase
        }
        // --- End TMDB Fetch ---

      } catch (err: any) {
        console.error("Error fetching list details or TMDB data:", err);
        // Handle specific Supabase errors (like not found) more gracefully
        if (err.code === 'PGRST116') { // PostgREST code for no rows found
             setError("List not found.");
        } else {
             setError(err.message || "Failed to load list details.");
        }
        setList(null);
        setDetailedItems([]); // Clear detailed items on error too
      } finally {
        // Only set loading false if user check is also complete
        if (!isUserLoading) {
            setIsLoading(false);
        }
      }
    };

    // Re-fetch when user loading completes if access was initially uncertain
    if (!isLoading && !isUserLoading && list && !list.is_public && !canEdit) {
        console.log("Re-checking permissions after user loaded...");
        fetchData(); // Re-run fetch to confirm permissions
    } else if (!isUserLoading || list?.is_public) { // Fetch initially if user loaded or list is public
         fetchData();
    }
    
  }, [listId, supabase, user, isUserLoading]); // Add dependencies

  // Secondary effect to handle loading state accurately based on user loading
   useEffect(() => {
      if (!isUserLoading && isLoading) {
          // If user has finished loading but data is still loading 
          // (likely waiting for permission check), we ensure loading stops
          // if an error occurred or data is fetched.
          if (error || list) { // If error is set or list data is available
              setIsLoading(false);
          }
      }
  }, [isUserLoading, isLoading, error, list]);

  // --- Handler for Removing Item (MOVED INSIDE COMPONENT) --- 
   const handleRemoveItem = async (listItemId: string) => {
      // Optimistically remove from UI
      const originalItems = [...detailedItems];
      setDetailedItems(prev => prev.filter(item => item.id !== listItemId));

      try {
         // Delete from Supabase
         const { error: deleteError } = await supabase
            .from('list_items')
            .delete()
            .eq('id', listItemId);

         if (deleteError) throw deleteError;

         // Optional: Show success toast
         // toast({ title: "Item Removed" }); 

      } catch (err) {
         console.error("Failed to remove item:", err);
         // Revert UI changes on error
         setDetailedItems(originalItems);
         setError("Failed to remove item from list.");
         // Optional: Show error toast
         // toast({ variant: "destructive", title: "Error Removing Item" });
      }
   };

  // --- Handler to trigger delete confirmation ---
  const handleDeleteList = () => {
    setShowDeleteConfirm(true);
  };

  // --- Handler to confirm and execute list deletion ---
  const confirmDeleteList = async () => {
    if (!list) return;
    
    setIsDeleting(true);
    setError(null);

    try {
      // Delete the list itself. Assumes RLS and FK constraints handle permissions and cascade.
      const { error: deleteError } = await supabase
        .from('custom_lists')
        .delete()
        .eq('id', list.id);

      if (deleteError) throw deleteError;

      toast({ title: "List Deleted", description: `"${list.name}" has been permanently deleted.` });
      router.push('/lists'); // Redirect to lists page after deletion

    } catch (err: any) {
      console.error("Failed to delete list:", err);
      setError(err.message || "Failed to delete the list.");
      toast({ variant: "destructive", title: "Error Deleting List", description: err.message || "Could not delete the list." });
      setIsDeleting(false); // Reset loading state on error
      setShowDeleteConfirm(false); // Close dialog on error
    }
    // No finally needed for loading state here, as success causes redirect
  };

  // --- Debounced Search Effect ---
  useEffect(() => {
    // Clear results and selection if query is empty
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setSelectedItem(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSelectedItem(null); // Clear selection when query changes

    const debounceTimer = setTimeout(async () => {
      try {
        console.log(`Searching TMDB for: "${searchQuery}"`);
        const response = await searchTmdb(searchQuery);
        // Filter out people results
        const filteredResults = response.results.filter(
          (item) => item.media_type === 'movie' || item.media_type === 'tv'
        );
        setSearchResults(filteredResults);
        console.log("Search results:", filteredResults);
      } catch (error) {
        console.error("Error searching TMDB:", error);
        setSearchResults([]); // Clear results on error
        // Optionally set an error state to display in the dialog
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    // Cleanup function
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // --- Function to handle adding the selected item --- (Placeholder for now)
  const handleAddItem = useCallback(async () => {
    if (!selectedItem || !listId || !user) {
      setAddItemError("No item selected or user/list not available.");
      return;
    }
    // Prevent adding if already exists (simple check on current detailedItems)
    if (detailedItems.some(item => item.tmdb_id === selectedItem.id && item.media_type === selectedItem.media_type)){
        setAddItemError("This item is already in the list.");
        toast({ variant: "destructive", title: "Already Exists", description: "This item is already in your list." });
        return;
    }

    setIsAddingItem(true);
    setAddItemError(null);

    try {
        // Calculate next sort_order (simple approach: count + 1)
        const nextSortOrder = detailedItems.length + 1;

        // Prepare data for insertion
        const newItemData = {
            list_id: listId,
            tmdb_id: selectedItem.id,
            media_type: selectedItem.media_type as 'movie' | 'tv', // Assert type
            sort_order: nextSortOrder,
        };

        console.log("Attempting to insert list item:", newItemData);

        // Insert into Supabase
        const { data: insertedItem, error: insertError } = await supabase
            .from('list_items')
            .insert(newItemData)
            .select()
            .single();

        if (insertError) {
            // Handle potential unique constraint violation (item already exists)
            if (insertError.code === '23505') { // Unique violation code for PostgreSQL
                throw new Error("This item is already in the list.");
            } else {
                throw insertError;
            }
        }
        
        console.log("Item added successfully:", insertedItem);

        // Optimistic UI Update (fetch TMDB details for the new item)
        const tmdbDetails = selectedItem.media_type === 'movie'
            ? await getMovieDetails(selectedItem.id)
            : await getTvDetails(selectedItem.id);
            
        const newDetailedItem: DetailedListItem = {
            ...(insertedItem as ListItem), // Use the inserted data from Supabase
            tmdbData: tmdbDetails
        };

        setDetailedItems(prev => [...prev, newDetailedItem].sort((a, b) => a.sort_order - b.sort_order));
        
        // Reset modal state and close
        setIsAddItemModalOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedItem(null);

        toast({ title: "Item Added", description: `"${selectedItem.title || selectedItem.name}" added to the list.` });

    } catch (err: any) {
        console.error("Error adding item to list:", err);
        setAddItemError(err.message || "Failed to add item.");
        toast({ variant: "destructive", title: "Error Adding Item", description: err.message || "Could not add the item to the list." });
    } finally {
        setIsAddingItem(false);
    }
  }, [selectedItem, listId, supabase, detailedItems, toast, user]);

  // --- Effect to clear search state when modal closes ---
  useEffect(() => {
      if (!isAddItemModalOpen) {
          // Delay clearing slightly to avoid flash of empty state before closing animation
          const timer = setTimeout(() => {
             setSearchQuery('');
             setSearchResults([]);
             setSelectedItem(null);
             setAddItemError(null); // Clear errors too
             setIsSearching(false);
             setIsAddingItem(false);
          }, 300); // Adjust timing if needed
          return () => clearTimeout(timer);
      }
  }, [isAddItemModalOpen]);

  // --- Render Logic ---

  if (isLoading || isUserLoading) {
    // Basic loading skeleton
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/4 mb-2"></div>
        <div className="h-6 bg-gray-800 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-800 rounded w-full"></div>
          <div className="h-20 bg-gray-800 rounded w-full"></div>
          <div className="h-20 bg-gray-800 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <Link href="/lists">
           <Button variant="outline">Back to My Lists</Button>
        </Link>
      </div>
    );
  }

  if (!list) {
    // This state might occur briefly or if list becomes null after error
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-400">List data is unavailable.</p>
         <Link href="/lists">
           <Button variant="outline">Back to My Lists</Button>
        </Link>
      </div>
    );
  }

  // --- Main Content --- 
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/lists" className="mb-6 inline-flex items-center text-sm text-blue-400 hover:text-blue-300">
         <ArrowLeft className="mr-2 h-4 w-4" />
         Back to Lists
      </Link>
      
      {/* List Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
           <div>
             <h1 className="text-3xl md:text-4xl font-bold mb-1">{list.name}</h1>
             {list.description && (
               <p className="text-gray-400 mt-1 max-w-prose">{list.description}</p>
             )}
             <p className="text-sm text-gray-500 mt-2">
               Created by {/* @ts-ignore */} 
               <Link href={`/profile/${list.users?.id || ''}`} className="hover:underline">
                   {/* @ts-ignore */} 
                   {list.users?.display_name || 'Unknown User'} 
               </Link>
               {' | '} {detailedItems.length} item(s) | {list.is_public ? 'Public' : 'Private'}
             </p>
           </div>
           {canEdit && (
               <div className="flex gap-2">
                   {/* Edit Button - Placeholder for navigation */}
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => router.push(`/lists/${listId}/edit`)} // Navigate to edit page
                   > 
                     <Edit className="mr-2 h-4 w-4" /> Edit List
                   </Button>
                   
                   {/* Delete Button - Triggers Dialog */}
                   <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleDeleteList} // Show confirmation dialog
                      disabled={isDeleting}
                   >
                      <Trash2 className="mr-2 h-4 w-4" /> {isDeleting ? 'Deleting...' : 'Delete List'}
                   </Button>
               </div>
           )}
        </div>
      </div>
      
      {/* List Items Area - Corrected Rendering */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 min-h-[200px]">
         <h2 className="text-xl font-semibold mb-4">Items</h2>
         {detailedItems.length > 0 ? (
           // Use MediaGrid for better layout
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {detailedItems.map((item) => (
                 <div key={item.id} className="relative group">
                   {item.tmdbData ? (
                       <MediaCard 
                           // Pass individual props, handling potential type differences
                           id={item.tmdbData.id}
                           title={item.media_type === 'movie' ? (item.tmdbData as MovieDetails).title : (item.tmdbData as TVDetails).name}
                           posterPath={item.tmdbData.poster_path}
                           releaseDate={item.media_type === 'movie' ? (item.tmdbData as MovieDetails).release_date : (item.tmdbData as TVDetails).first_air_date}
                           voteAverage={item.tmdbData.vote_average}
                           mediaType={item.media_type as 'movie' | 'tv'}
                        />
                   ) : (
                       // Fallback display
                       <div className="aspect-[2/3] bg-gray-800 rounded flex flex-col items-center justify-center text-center p-2">
                          <p className="text-sm font-medium">ID: {item.tmdb_id}</p>
                          <p className="text-xs text-gray-400">({item.media_type})</p>
                          <p className="text-xs text-red-400 mt-1">Details unavailable</p>
                       </div>
                   )}
                   {/* Remove Button */}
                   {canEdit && (
                     <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-1 right-1 z-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveItem(item.id)} // Use the handler moved inside
                        aria-label={`Remove ${item.media_type === 'movie' ? (item.tmdbData as MovieDetails)?.title : (item.tmdbData as TVDetails)?.name || 'item'}`}
                      >
                          <Trash2 className="h-4 w-4"/>
                      </Button>
                   )}
                 </div> 
              ))}
            </div> 
         ) : (
            <p className="text-gray-500 italic text-center pt-8">This list is empty.</p>
         )}
      </div> 

      {/* --- Delete Confirmation Dialog --- */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the list
              "{list?.name || 'this list'}" and all its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteList} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Yes, delete list'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Add Item Dialog --- */}
      <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
         <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
           <DialogHeader>
             <DialogTitle>Add Item to List</DialogTitle>
             <DialogDescription>
               Search for a movie or TV show to add to "{list?.name || 'this list'}".
             </DialogDescription>
           </DialogHeader>
           <div className="flex-1 flex flex-col gap-4 overflow-hidden py-1"> {/* Adjusted padding */}
             {/* Search Input */}
             <div className="px-1"> {/* Add padding around input */} 
                <Input
                  placeholder="Search TMDB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isAddingItem}
                />
             </div>
             {/* Search Results Area */}
             <ScrollArea className="flex-1 px-1"> {/* Add padding and allow scroll */}
               <div className="space-y-2 pr-2"> {/* Add space between items and padding for scrollbar */}
                 {isSearching && <p className="text-center text-gray-500 py-4">Searching...</p>}
                 {!isSearching && searchResults.length === 0 && searchQuery.length > 0 && (
                   <p className="text-center text-gray-500 py-4">No results found.</p>
                 )}
                 {!isSearching && searchResults.map((item) => (
                   <button
                     key={item.id}
                     onClick={() => setSelectedItem(item)} // Select item on click
                     disabled={isAddingItem}
                     className={cn(
                       "w-full flex items-center p-2 rounded-md text-left hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 transition-colors",
                       selectedItem?.id === item.id && "bg-blue-900/50 ring-2 ring-blue-600"
                     )}
                   >
                     <div className="flex-shrink-0 w-12 h-18 mr-3">
                        <Image
                           src={getTmdbImageUrl(item.poster_path, 'w92')}
                           alt={item.title || item.name || 'Poster'}
                           width={48} 
                           height={72}
                           className="rounded object-cover"
                        />
                     </div>
                     <div className="flex-1 overflow-hidden">
                       <p className="font-medium truncate">{item.title || item.name}</p>
                       <p className="text-sm text-gray-400">
                         {item.media_type === 'movie' ? 'Movie' : 'TV Show'} 
                         {item.release_date && ` (${item.release_date.substring(0, 4)})`}
                         {item.first_air_date && ` (${item.first_air_date.substring(0, 4)})`}
                       </p>
                       {/* Optional: Add more details like overview snippet */}
                       {/* <p className="text-xs text-gray-500 truncate mt-1">{item.overview}</p> */}
                     </div>
                   </button>
                 ))}
               </div>
             </ScrollArea>
           </div>
           {/* Error message area */}
           {addItemError && (
               <div className="px-1 text-sm text-red-500 mt-1">
                   {addItemError}
               </div>
           )}
           <DialogFooter className="mt-auto pt-4 px-1"> {/* Ensure footer is at bottom */}
              <DialogClose asChild>
                 <Button type="button" variant="secondary" disabled={isAddingItem}>
                   Cancel
                 </Button>
               </DialogClose>
             {/* Add button */}
             <Button 
               type="button" 
               onClick={handleAddItem}
               disabled={!selectedItem || isAddingItem || isSearching} 
             >
               {isAddingItem ? "Adding..." : "Add to List"}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

      {/* Add Item Modal Trigger Button (only if canEdit) */}
      {canEdit && (
        <div className="fixed bottom-8 right-8">
           <Button 
             size="lg" 
             className="rounded-full shadow-lg" 
             onClick={() => setIsAddItemModalOpen(true)} // Open the dialog
             aria-label="Add item to list"
           >
             <Plus className="mr-2 h-5 w-5" /> Add Item
           </Button>
        </div>
      )}
    </div> 
  ); 
} 