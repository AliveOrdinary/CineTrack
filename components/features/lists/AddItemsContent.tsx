"use client"

import { useState, useEffect } from "react"
import { createClient, getCustomListWithItems, addItemToList, checkItemInList, type CustomListWithItems } from "@/lib/supabase/client"
import { searchMulti } from "@/lib/tmdb/client"
import { TmdbMedia } from "@/lib/tmdb/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Search, Plus, Check, Film, Tv, User, Star, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

interface AddItemsContentProps {
  listId: string;
}

interface SearchResultWithStatus extends TmdbMedia {
  isInList?: boolean;
  isAdding?: boolean;
}

export function AddItemsContent({ listId }: AddItemsContentProps) {
  const [list, setList] = useState<CustomListWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultWithStatus[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SearchResultWithStatus | null>(null)
  const [notes, setNotes] = useState('')

  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  useEffect(() => {
    loadListData()
  }, [listId])

  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery)
    } else {
      setSearchResults([])
    }
  }, [debouncedSearchQuery])

  const loadListData = async () => {
    try {
      setIsLoading(true)
      
      // Check if user is authenticated
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Please log in to add items to lists")
        return
      }

      // Get list data
      const listData = await getCustomListWithItems(listId)
      setList(listData)
      
      // Check if current user is the owner
      setIsOwner(user.id === listData.user_id)
      
      if (user.id !== listData.user_id) {
        toast.error("You can only add items to your own lists")
        return
      }
    } catch (error) {
      console.error('Error loading list:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        notFound()
      }
      toast.error("Failed to load list")
    } finally {
      setIsLoading(false)
    }
  }

  const performSearch = async (query: string) => {
    try {
      setIsSearching(true)
      const response = await searchMulti(query)
      
      // Filter to only movies and TV shows
      const filteredResults = response.results.filter((item: TmdbMedia) => 
        item.media_type === 'movie' || item.media_type === 'tv'
      )

      // Check which items are already in the list
      const resultsWithStatus = await Promise.all(
        filteredResults.map(async (item: TmdbMedia) => {
          const isInList = await checkItemInList(listId, item.id, item.media_type as 'movie' | 'tv')
          return {
            ...item,
            isInList
          }
        })
      )

      setSearchResults(resultsWithStatus)
    } catch (error) {
      console.error('Error searching:', error)
      toast.error("Failed to search content")
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddItem = async (item: SearchResultWithStatus, itemNotes?: string) => {
    try {
      // Update UI immediately
      setSearchResults(prev => prev.map(result => 
        result.id === item.id ? { ...result, isAdding: true } : result
      ))

      await addItemToList({
        list_id: listId,
        tmdb_id: item.id,
        media_type: item.media_type as 'movie' | 'tv',
        notes: itemNotes || undefined
      })

      // Update the item status
      setSearchResults(prev => prev.map(result => 
        result.id === item.id 
          ? { ...result, isInList: true, isAdding: false }
          : result
      ))

      toast.success(`Added "${item.title || item.name}" to list`)
      setSelectedItem(null)
      setNotes('')
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error("Failed to add item to list")
      
      // Revert UI state
      setSearchResults(prev => prev.map(result => 
        result.id === item.id ? { ...result, isAdding: false } : result
      ))
    }
  }

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'movie': return <Film className="h-4 w-4" />
      case 'tv': return <Tv className="h-4 w-4" />
      case 'person': return <User className="h-4 w-4" />
      default: return <Film className="h-4 w-4" />
    }
  }

  const getMediaTypeColor = (mediaType: string) => {
    switch (mediaType) {
      case 'movie': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'tv': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'person': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-12 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!list || !isOwner) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {!list ? "List not found." : "You can only add items to your own lists."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/lists/${listId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Add Items to "{list.name}"</h1>
          <p className="text-muted-foreground">
            Search for movies and TV shows to add to your list
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for movies and TV shows..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Search Results {searchResults.length > 0 && `(${searchResults.length})`}
          </h2>
          
          {searchResults.length === 0 && !isSearching ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((item) => (
                <Card key={`${item.media_type}-${item.id}`} className="overflow-hidden">
                  <div className="relative aspect-[2/3]">
                    {item.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        alt={item.title || item.name || 'Poster'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        {getMediaTypeIcon(item.media_type)}
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <h3 className="font-medium text-sm line-clamp-2">
                          {item.title || item.name}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className={getMediaTypeColor(item.media_type)}>
                            {getMediaTypeIcon(item.media_type)}
                            <span className="ml-1 capitalize">{item.media_type}</span>
                          </Badge>
                          
                          {item.vote_average && item.vote_average > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-muted-foreground">
                                {item.vote_average.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {(item.release_date || item.first_air_date) && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.release_date || item.first_air_date!).getFullYear()}
                          </p>
                        )}
                      </div>
                      
                      {item.isInList ? (
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          <Check className="h-4 w-4 mr-2" />
                          Already in List
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleAddItem(item)}
                            disabled={item.isAdding}
                          >
                            {item.isAdding ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            Add
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedItem(item)}
                                disabled={item.isAdding}
                              >
                                Notes
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add with Notes</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  {item.poster_path && (
                                    <div className="relative w-16 h-24 flex-shrink-0">
                                      <Image
                                        src={`https://image.tmdb.org/t/p/w200${item.poster_path}`}
                                        alt={item.title || item.name || 'Poster'}
                                        fill
                                        className="object-cover rounded"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="font-medium">{item.title || item.name}</h3>
                                    <Badge variant="secondary" className={getMediaTypeColor(item.media_type)}>
                                      {getMediaTypeIcon(item.media_type)}
                                      <span className="ml-1 capitalize">{item.media_type}</span>
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label htmlFor="notes">Notes (Optional)</Label>
                                  <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add your thoughts about this item..."
                                    rows={3}
                                  />
                                </div>
                                
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setSelectedItem(null)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => handleAddItem(item, notes)}
                                    disabled={item.isAdding}
                                  >
                                    {item.isAdding ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Plus className="h-4 w-4 mr-2" />
                                    )}
                                    Add to List
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!searchQuery.trim() && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Search for Content</h3>
          <p className="text-muted-foreground">
            Use the search bar above to find movies and TV shows to add to your list
          </p>
        </div>
      )}
    </div>
  )
} 