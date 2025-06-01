"use client"

import { useState, useEffect } from "react"
import { updateCustomList, uploadListBanner, deleteListBanner, getListBannerUrl, type CustomList } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { Users, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface EditListDialogProps {
  list: CustomList
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (updatedList: CustomList) => void
}

export function EditListDialog({ list, isOpen, onOpenChange, onUpdate }: EditListDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: list.name,
    description: list.description || '',
    visibility: list.visibility || 'public' as 'public' | 'followers' | 'private'
  })

  useEffect(() => {
    if (isOpen && list.id) {
      loadBannerImage()
    }
  }, [isOpen, list.id])

  useEffect(() => {
    // Reset form when list changes
    setForm({
      name: list.name,
      description: list.description || '',
      visibility: list.visibility || 'public'
    })
  }, [list])

  const loadBannerImage = async () => {
    try {
      if (list.banner_image_url) {
        setBannerUrl(list.banner_image_url)
      } else {
        // Try to load from storage
        const url = await getListBannerUrl(list.id!)
        setBannerUrl(url)
      }
    } catch (error) {
      console.error('Error loading banner image:', error)
    }
  }

  const handleBannerUpload = async (file: File): Promise<string> => {
    if (!list.id) throw new Error('List ID is required')
    
    // Delete existing banner if it exists
    if (bannerUrl) {
      try {
        await deleteListBanner(bannerUrl)
      } catch (error) {
        console.warn('Failed to delete existing banner:', error)
      }
    }

    // Upload new banner
    const url = await uploadListBanner(list.id, file)
    return url
  }

  const handleBannerDelete = async (url: string) => {
    await deleteListBanner(url)
  }

  const handleSave = async () => {
    try {
      if (!form.name.trim()) {
        toast.error("Please enter a list name")
        return
      }

      setIsLoading(true)

      const updates: Partial<CustomList> = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        visibility: form.visibility,
        banner_image_url: bannerUrl || undefined
      }

      const updatedList = await updateCustomList(list.id!, updates)
      
      onUpdate({ ...list, ...updatedList })
      onOpenChange(false)
      toast.success("List updated successfully")
    } catch (error) {
      console.error('Error updating list:', error)
      toast.error("Failed to update list")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Banner Image Upload */}
          <div>
            <Label>Banner Image (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Add a custom banner to make your list stand out
            </p>
            <ImageUpload
              value={bannerUrl || undefined}
              onChange={setBannerUrl}
              onUpload={handleBannerUpload}
              onDelete={handleBannerDelete}
              aspectRatio="banner"
              maxSizeInMB={5}
              disabled={isLoading}
            />
          </div>

          {/* List Name */}
          <div>
            <Label htmlFor="name">List Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter list name"
              maxLength={100}
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your list..."
              rows={3}
              maxLength={500}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.description.length}/500 characters
            </p>
          </div>

          {/* Visibility */}
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={form.visibility}
              onValueChange={(value: 'public' | 'followers' | 'private') => 
                setForm(prev => ({ ...prev, visibility: value }))
              }
              disabled={isLoading}
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

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 