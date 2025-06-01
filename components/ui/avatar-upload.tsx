'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Camera, Crop, RotateCcw, Download, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { avatarEvents } from '@/lib/utils/avatar-events';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  fallbackText: string;
  onAvatarChange: (avatarUrl: string | null) => void;
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function AvatarUpload({
  currentAvatarUrl,
  fallbackText,
  onAvatarChange,
  userId,
  size = 'md',
  className = '',
}: AvatarUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image');
      return false;
    }

    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 2MB');
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setImageLoaded(false);
    setIsOpen(true);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const getCroppedCanvas = (): HTMLCanvasElement | null => {
    if (!imageRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const image = imageRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to cropped area
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    // Draw the cropped portion of the image
    ctx.drawImage(
      image,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      cropArea.width,
      cropArea.height
    );

    return canvas;
  };

  const uploadToSupabase = async (file: Blob): Promise<string> => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    // Generate unique filename
    const timestamp = Date.now();
    const extension = selectedFile?.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from('avatars').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL with cache-busting parameter
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);

    // Add cache-busting parameter to force image refresh
    const urlWithCacheBust = `${urlData.publicUrl}?t=${timestamp}`;
    return urlWithCacheBust;
  };

  const updateUserAvatar = async (avatarUrl: string) => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);

      // Get cropped image as blob
      const canvas = getCroppedCanvas();
      if (!canvas) {
        throw new Error('Failed to process image');
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create image blob'));
            }
          },
          'image/jpeg',
          0.85
        );
      });

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        await deleteCurrentAvatar();
      }

      // Upload new avatar
      const avatarUrl = await uploadToSupabase(blob);

      // Update user profile
      await updateUserAvatar(avatarUrl);

      // Call parent callback
      onAvatarChange(avatarUrl);

      // Emit event to notify other components
      avatarEvents.emit(userId, avatarUrl);

      toast.success('Avatar updated successfully');
      setIsOpen(false);
      resetState();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteCurrentAvatar = async () => {
    if (!currentAvatarUrl) return;

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Extract file path from URL
      const url = new URL(currentAvatarUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts.slice(-2).join('/'); // userId/filename

      // Delete from storage
      const { error } = await supabase.storage.from('avatars').remove([fileName]);

      if (error) {
        console.error('Error deleting old avatar:', error);
      }
    } catch (error) {
      console.error('Error deleting old avatar:', error);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true);

      // Delete current avatar
      if (currentAvatarUrl) {
        await deleteCurrentAvatar();
      }

      // Update user profile to remove avatar
      await updateUserAvatar('');

      // Call parent callback
      onAvatarChange(null);

      // Emit event to notify other components
      avatarEvents.emit(userId, null);

      toast.success('Avatar removed successfully');
      setIsOpen(false);
      resetState();
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageLoaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    // Set initial crop area to center of image
    if (imageRef.current) {
      const { width, height } = imageRef.current;
      const size = Math.min(width, height, 200);
      setCropArea({
        x: (width - size) / 2,
        y: (height - size) / 2,
        width: size,
        height: size,
      });
    }
  };

  return (
    <>
      <div className={`relative group cursor-pointer ${className}`}>
        <div
          className={`${sizeClasses[size]} border-2 border-dashed border-transparent group-hover:border-primary transition-colors rounded-full overflow-hidden bg-muted flex items-center justify-center`}
          onClick={() => setIsOpen(true)}
        >
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
              key={currentAvatarUrl} // Force re-render when URL changes
              onError={e => {
                // If image fails to load, show fallback
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
              onLoad={e => {
                // When image loads successfully, hide fallback
                e.currentTarget.nextElementSibling?.classList.add('hidden');
              }}
            />
          ) : null}
          <div
            className={`absolute inset-0 flex items-center justify-center text-sm font-medium ${currentAvatarUrl ? 'hidden' : ''}`}
          >
            {fallbackText}
          </div>
        </div>

        <Button
          size="sm"
          className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <Camera className="h-3 w-3" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Avatar</DialogTitle>
            <DialogDescription>
              Upload a new avatar image. The image will be cropped to a square.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!previewUrl ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Drag and drop an image here, or click to select
                  </p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Select Image
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">JPEG, PNG, or WebP • Max 2MB</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full h-auto rounded"
                    onLoad={handleImageLoad}
                  />

                  {imageLoaded && (
                    <div
                      className="absolute border-2 border-primary bg-primary/20 cursor-move"
                      style={{
                        left: cropArea.x,
                        top: cropArea.y,
                        width: cropArea.width,
                        height: cropArea.height,
                      }}
                      onMouseDown={e => {
                        // Simple drag implementation
                        const startX = e.clientX - cropArea.x;
                        const startY = e.clientY - cropArea.y;

                        const handleMouseMove = (e: MouseEvent) => {
                          if (!imageRef.current) return;

                          const rect = imageRef.current.getBoundingClientRect();
                          const newX = Math.max(
                            0,
                            Math.min(
                              e.clientX - startX - rect.left,
                              imageRef.current.width - cropArea.width
                            )
                          );
                          const newY = Math.max(
                            0,
                            Math.min(
                              e.clientY - startY - rect.top,
                              imageRef.current.height - cropArea.height
                            )
                          );

                          setCropArea(prev => ({ ...prev, x: newX, y: newY }));
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Different
                  </Button>
                </div>
              </div>
            )}

            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          <DialogFooter>
            <div className="flex gap-2 w-full">
              {currentAvatarUrl && (
                <Button variant="destructive" onClick={handleRemoveAvatar} disabled={isUploading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}

              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogFooter>

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>
    </>
  );
}
