"use client"

import { useState, useEffect } from "react"
import { createClient, getUserCustomLists, createCustomList, deleteCustomList, type CustomListWithItems, type CustomList } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EditListDialog } from "./EditListDialog"
import { Plus, List, Eye, EyeOff, Users, Trash2, Edit, Calendar } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import Image from "next/image"

export function ListsContent() {
  const [lists, setLists] = useState<CustomListWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingList, setEditingList] = useState<CustomList | null>(null)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    visibility: 'public' as 'public' | 'followers' | 'private'
  })

  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = async () => {
    try {
      setIsLoading(true)
      
      // Check if user is authenticated
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Please log in to view your lists")
        return
      }

      const listsData = await getUserCustomLists()
      setLists(listsData)
    } catch (error) {
      console.error('Error loading lists:', error)
      toast.error("Failed to load lists")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateList = async () => {
    try {
      if (!createForm.name.trim()) {
        toast.error("Please enter a list name")
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Please log in to create lists")
        return
      }

      const newList = await createCustomList({
        user_id: user.id,
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        visibility: createForm.visibility
      })

      setLists(prev => [{ ...newList, item_count: 0 }, ...prev])
      setIsCreateOpen(false)
      setCreateForm({ name: '', description: '', visibility: 'public' })
      toast.success("List created successfully")
    } catch (error) {
      console.error('Error creating list:', error)
      toast.error("Failed to create list")
    }
  }

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!confirm(`Are you sure you want to delete "${listName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteCustomList(listId)
      setLists(prev => prev.filter(list => list.id !== listId))
      toast.success("List deleted successfully")
    } catch (error) {
      console.error('Error deleting list:', error)
      toast.error("Failed to delete list")
    }
  }

  const handleEditList = (list: CustomListWithItems) => {
    setEditingList(list as CustomList)
  }

  const handleUpdateList = (updatedList: CustomList) => {
    setLists(prev => prev.map(list => 
      list.id === updatedList.id 
        ? { ...list, ...updatedList }
        : list
    ))
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Users className="h-3 w-3" />
      case 'followers': return <Eye className="h-3 w-3" />
      case 'private': return <EyeOff className="h-3 w-3" />
      default: return <Users className="h-3 w-3" />
    }
  }

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'followers': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'private': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create List Button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5" />
          <span className="text-lg font-medium">
            {lists.length} {lists.length === 1 ? 'List' : 'Lists'}
          </span>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">List Name</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter list name"
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your list..."
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={createForm.visibility}
                  onValueChange={(value: 'public' | 'followers' | 'private') => 
                    setCreateForm(prev => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Public - Anyone can see this list
                      </div>
                    </SelectItem>
                    <SelectItem value="followers">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Followers - Only your followers can see this list
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        Private - Only you can see this list
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateList}>
                  Create List
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <div className="text-center py-12">
          <List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No lists yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first list to organize your favorite movies and TV shows
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First List
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <Card key={list.id} className="group hover:shadow-md transition-shadow overflow-hidden">
              {/* Banner Image */}
              {list.banner_image_url && (
                <div className="aspect-[3/1] relative">
                  <Image
                    src={list.banner_image_url}
                    alt={`${list.name} banner`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{list.name}</CardTitle>
                    {list.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {list.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleEditList(list)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => handleDeleteList(list.id!, list.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className={getVisibilityColor(list.visibility!)}>
                      {getVisibilityIcon(list.visibility!)}
                      <span className="ml-1 capitalize">{list.visibility}</span>
                    </Badge>
                    
                    <span className="text-sm text-muted-foreground">
                      {list.item_count || 0} items
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Updated {formatDistanceToNow(new Date(list.updated_at || ''), { addSuffix: true })}
                  </div>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/lists/${list.id}`}>
                      View List
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit List Dialog */}
      {editingList && (
        <EditListDialog
          list={editingList}
          isOpen={!!editingList}
          onOpenChange={(open) => !open && setEditingList(null)}
          onUpdate={handleUpdateList}
        />
      )}
    </div>
  )
} 