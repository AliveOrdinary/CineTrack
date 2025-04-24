'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useUser from '@/hooks/useUser';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Textarea } from "@/components/ui/textarea"; 
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { search as tmdbSearch, getImageUrl as getTmdbImageUrl } from '@/services/tmdb';
import { MultiSearchResult, SearchResult } from '@/types/tmdb';
import Image from 'next/image';
import { FilmIcon, TvIcon, PlusCircleIcon, XCircleIcon, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Define the structure for list data being created
interface NewListData {
  name: string;
  description: string;
  is_public: boolean;
}

// Define structure for items added to the list
interface ListItemToAdd {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  // Optional: Store basic details for display in Step 2
  title?: string; 
  poster_path?: string | null;
}

// Define the steps
type CreateListStep = 'details' | 'addItems' | 'chooseImage';

export default function CreateListPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  
  const [currentStep, setCurrentStep] = useState<CreateListStep>('details');
  const [listData, setListData] = useState<NewListData>({
    name: '',
    description: '',
    is_public: false,
  });
  const [selectedItems, setSelectedItems] = useState<ListItemToAdd[]>([]);
  
  // State for Step 2: Add Items
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce input
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in after loading
  useEffect(() => {
    if (!isUserLoading && !user) {
      console.log('Create List page: No user found after loading, redirecting to login');
      router.push('/login?redirect=/create-list');
    }
  }, [isUserLoading, user, router]);

  // Effect to trigger search when debounced query changes
  useEffect(() => {
    const searchMoviesAndTv = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 3) {
        setSearchResults([]);
        setIsSearching(false);
        setSearchError(null);
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      setSearchResults([]); // Clear previous results

      try {
        // Use the imported search function without mediaType for multi-search
        const data = await tmdbSearch(debouncedSearchQuery, 1, false) as MultiSearchResult; // Assert type
        // Filter out people, keep only movies and tv
        const validResults = data.results.filter((res: SearchResult) => res.media_type === 'movie' || res.media_type === 'tv'); // Use imported type
        setSearchResults(validResults);
      } catch (err: any) {
        console.error("Error searching TMDB:", err);
        setSearchError(err.message || "Failed to fetch search results.");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchMoviesAndTv();
  }, [debouncedSearchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setListData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error on input change
  };

  const handlePublicToggle = (checked: boolean) => {
    setListData(prev => ({ ...prev, is_public: checked }));
  };
  
  const handleNextStep = () => {
    // Validate Step 1 data
    if (currentStep === 'details') {
        if (!listData.name.trim()) {
          setError('List name is required.');
          toast({ variant: "destructive", title: "Validation Error", description: "List name cannot be empty." });
          return;
        }
        setError(null);
        setCurrentStep('addItems'); 
    } else if (currentStep === 'addItems') {
        // Optionally validate if at least one item is added
        // if (selectedItems.length === 0) {
        //    setError('Please add at least one item to the list.');
        //    toast({ variant: "destructive", title: "Validation Error", description: "Add at least one movie or TV show." });
        //    return;
        // }
        setError(null);
        // Skip Step 3 (Choose Image) for now and go straight to submit
        // setCurrentStep('chooseImage'); 
        handleSubmitList(); // Call submit directly from Step 2
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'addItems') {
      setCurrentStep('details');
    } 
    // No Step 3 for now
    // else if (currentStep === 'chooseImage') {
    //    setCurrentStep('addItems');
    // }
  };
  
  // Handler to add an item to the selected list
  const handleAddItem = (item: SearchResult) => { // Use imported type
    // Check if item already exists
    if (selectedItems.some(selected => selected.tmdb_id === item.id && selected.media_type === item.media_type)) {
      toast({ variant: "default", title: "Already Added", description: `"${item.title || item.name}" is already in your list.` });
      return;
    }
    
    // Ensure we only add movies or tv shows (should be pre-filtered, but safe check)
    if (item.media_type !== 'movie' && item.media_type !== 'tv') {
        console.warn("Attempted to add non-movie/tv item:", item);
        return;
    }

    const newItem: ListItemToAdd = {
      tmdb_id: item.id,
      media_type: item.media_type, // Type is now guaranteed to be 'movie' or 'tv'
      title: item.title || item.name, // Use title for movie, name for TV
      poster_path: item.poster_path,
    };
    setSelectedItems(prev => [...prev, newItem]);
    setSearchQuery(''); // Clear search after adding
    setSearchResults([]);
    setSearchError(null);
  };

  // Handler to remove an item from the selected list
  const handleRemoveItem = (tmdbId: number, mediaType: 'movie' | 'tv') => {
    setSelectedItems(prev => prev.filter(item => !(item.tmdb_id === tmdbId && item.media_type === mediaType)));
  };
  
  // Updated submission function
  const handleSubmitList = async () => {
     if (!user) return;
     // Add validation for step 2 if needed (e.g., ensure items exist)
     if (selectedItems.length === 0) {
       toast({ variant: "destructive", title: "Empty List", description: "Please add at least one movie or TV show before creating the list." });
       return;
     }
     
     setIsSubmitting(true);
     setError(null);
     
     try {
       // 1. Insert into custom_lists table
       const { data: newList, error: listError } = await supabase
         .from('custom_lists')
         .insert({
           user_id: user.id,
           name: listData.name,
           description: listData.description || null, // Use null if empty
           is_public: listData.is_public,
           // created_at, updated_at have defaults
         })
         .select('id') // Select the ID of the newly created list
         .single(); // Expect only one row back

       if (listError) throw listError;
       if (!newList?.id) throw new Error("Failed to create list or retrieve its ID.");

       // 2. Prepare items for list_items table
       const itemsToInsert = selectedItems.map((item, index) => ({
         list_id: newList.id,
         tmdb_id: item.tmdb_id,
         media_type: item.media_type,
         sort_order: index, // Use array index for initial sort order
         // added_at has default
       }));

       // 3. Insert into list_items table
       const { error: itemsError } = await supabase
         .from('list_items')
         .insert(itemsToInsert);

       if (itemsError) {
         // Attempt to clean up the created list if items fail to insert
         console.error("Error inserting list items, attempting to delete parent list:", itemsError);
         await supabase.from('custom_lists').delete().eq('id', newList.id);
         throw itemsError; // Re-throw the error
       }
       
       toast({ title: "List Created!", description: `"${listData.name}" has been created successfully.` });
       router.push('/lists'); // Redirect to the main lists page
       
     } catch (err: any) {
       console.error("Error creating list:", err);
       const message = err.message || "Failed to create list.";
       setError(message);
       toast({ variant: "destructive", title: "Creation Failed", description: message });
     } finally {
       setIsSubmitting(false);
     }
  };

  // --- Render Logic ---

  // Loading state for user session
  if (isUserLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-10 bg-gray-800 rounded w-1/3 mb-6"></div>
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-800 rounded mb-4"></div>
          <div className="h-20 bg-gray-800 rounded mb-4"></div>
          <div className="h-10 bg-gray-800 rounded w-1/4 ml-auto"></div>
        </div>
      </div>
    );
  }

  // If loading finished but no user
  if (!user) {
    return null; 
  }
  
  // Function to render the current step's content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'details':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-lg font-semibold">List Name</Label>
              <Input 
                id="name"
                name="name"
                value={listData.name}
                onChange={handleInputChange}
                placeholder="e.g., My Favorite Sci-Fi Movies"
                required
                className="mt-2 text-base"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-lg font-semibold">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={listData.description}
                onChange={handleInputChange}
                placeholder="A brief description of your list..."
                rows={4}
                className="mt-2 text-base"
              />
            </div>
            
            <div className="flex items-center justify-between rounded-lg border border-gray-700 p-4 bg-gray-850">
               <div>
                 <Label htmlFor="is_public" className="text-base font-medium">
                   Make List Public?
                 </Label>
                 <p className="text-sm text-gray-400">
                   Allow other users to view this list.
                 </p>
               </div>
               <Switch
                 id="is_public"
                 checked={listData.is_public}
                 onCheckedChange={handlePublicToggle}
               />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );
      case 'addItems':
        return (
           <div className="space-y-6">
             <div>
               <Label htmlFor="itemSearch" className="text-lg font-semibold">Add Movies & TV Shows</Label>
               <Input 
                 id="itemSearch"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search for movies or TV shows to add..."
                 className="mt-2 text-base"
               />
             </div>
             
             {/* Search Results */}
             <div className="relative min-h-[200px]"> 
                {isSearching && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                )}
                {!isSearching && searchError && (
                   <div className="text-center text-red-500 pt-4">Error: {searchError}</div>
                )}
                {!isSearching && !searchError && debouncedSearchQuery.length >= 3 && searchResults.length === 0 && (
                   <div className="text-center text-gray-400 pt-4">No results found for "{debouncedSearchQuery}".</div>
                )}
                {!isSearching && !searchError && searchResults.length > 0 && (
                  <ScrollArea className="h-[300px] rounded-md border border-gray-700 bg-gray-850">
                     <ul className="divide-y divide-gray-700 p-2">
                       {searchResults.map((item) => (
                         <li key={`${item.media_type}-${item.id}`} className="flex items-center justify-between p-2 hover:bg-gray-800 rounded-md">
                           <div className="flex items-center gap-3 min-w-0">
                             <Image 
                               src={getTmdbImageUrl(item.poster_path, 'w92')} 
                               alt={item.title || item.name || 'Media poster'}
                               width={40}
                               height={60}
                               className="rounded object-cover bg-gray-700"
                             />
                             <div className="flex-1 min-w-0">
                               <p className="font-medium truncate">{item.title || item.name}</p>
                               <span className="text-xs text-gray-400 flex items-center gap-1">
                                 {item.media_type === 'movie' ? <FilmIcon className="h-3 w-3" /> : <TvIcon className="h-3 w-3" />} 
                                 {item.media_type === 'movie' ? item.release_date?.substring(0, 4) : item.first_air_date?.substring(0, 4)}
                               </span>
                             </div>
                           </div>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => handleAddItem(item)} 
                             className="text-green-500 hover:text-green-400 flex-shrink-0"
                             aria-label={`Add ${item.title || item.name} to list`}
                           >
                             <PlusCircleIcon className="h-5 w-5" />
                           </Button>
                         </li>
                       ))}
                     </ul>
                   </ScrollArea>
                )}
             </div>
           </div>
        );
      default:
        setCurrentStep('details'); // Reset to first step if state is invalid
        return <p>Invalid step. Resetting...</p>; 
    }
  };

  // Function to render the sidebar step indicator
  const renderSidebar = () => {
    const steps: { id: CreateListStep; label: string }[] = [
      { id: 'details', label: 'Step 1: List Details' },
      { id: 'addItems', label: 'Step 2: Add Items' },
    ];

    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 sticky top-8">
        <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">List Items ({selectedItems.length})</h3>
        {selectedItems.length === 0 ? (
            <p className="text-gray-400 text-sm">Search for items to add them here.</p>
        ) : (
          <ScrollArea className="h-[400px] pr-3">
             <ul className="space-y-2">
               {selectedItems.map((item) => (
                 <li key={`${item.media_type}-${item.tmdb_id}`} className="flex items-center justify-between p-2 bg-gray-800 rounded-md">
                    <div className="flex items-center gap-2 min-w-0">
                      <Image 
                         src={getTmdbImageUrl(item.poster_path ?? null, 'w92')}
                         alt={item.title || 'Selected item poster'}
                         width={32}
                         height={48}
                         className="rounded object-cover bg-gray-700 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          {item.media_type === 'movie' ? <FilmIcon className="h-3 w-3" /> : <TvIcon className="h-3 w-3" />} 
                          {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                        </span>
                      </div>
                    </div>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     onClick={() => handleRemoveItem(item.tmdb_id, item.media_type)} 
                     className="text-red-500 hover:text-red-400 flex-shrink-0 h-7 w-7"
                     aria-label={`Remove ${item.title} from list`}
                   >
                     <XCircleIcon className="h-4 w-4" />
                   </Button>
                 </li>
               ))}
             </ul>
          </ScrollArea>
        )}
        {currentStep === 'addItems' && (
           <>
             <Separator className="my-4 bg-gray-700" />
             <Button 
               onClick={handleSubmitList} 
               disabled={isSubmitting || selectedItems.length === 0}
               className="w-full"
             >
               {isSubmitting ? 'Creating List...' : 'Create List'}
             </Button>
             {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
           </>
         )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
       <h1 className="text-3xl font-bold mb-6">Create a New List</h1>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
             {renderStepContent()}
             <div className="mt-8 flex justify-between">
                {currentStep !== 'details' && (
                  <Button variant="outline" onClick={handlePreviousStep} disabled={isSubmitting}>
                    Previous Step
                  </Button>
                )}
                {currentStep === 'details' && (
                  <Button onClick={handleNextStep} disabled={isSubmitting} className="ml-auto">
                    Next: Add Items
                  </Button>
                )}
             </div>
         </div>
         
         <div className="lg:col-span-1">
             {renderSidebar()}
         </div>
     </div>
    </div>
  );
} 