'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  onUpload: (file: File) => Promise<string>;
  onDelete?: (url: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'banner';
  maxSizeInMB?: number;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  onDelete,
  disabled = false,
  className,
  aspectRatio = 'banner',
  maxSizeInMB = 5,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    banner: 'aspect-[3/1]',
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, WebP, or GIF)';
    }

    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return `File size must be less than ${maxSizeInMB}MB`;
    }

    return null;
  };

  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new window.Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }

      try {
        setIsUploading(true);

        // Compress image before upload
        const compressedFile = await compressImage(file);

        // Upload file
        const url = await onUpload(compressedFile);
        onChange(url);
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, onChange, maxSizeInMB]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDelete = async () => {
    if (!value || !onDelete) return;

    if (confirm('Are you sure you want to remove this image?')) {
      try {
        await onDelete(value);
        onChange(null);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete image. Please try again.');
      }
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {value ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className={cn('relative', aspectRatioClasses[aspectRatio])}>
              <Image src={value} alt="Uploaded image" fill className="object-cover" />
              {!disabled && (
                <div className="absolute top-2 right-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn(
            'border-2 border-dashed transition-colors cursor-pointer',
            isDragOver && 'border-primary bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        >
          <CardContent className={cn('p-8', aspectRatioClasses[aspectRatio])}>
            <div className="flex flex-col items-center justify-center h-full text-center">
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Uploading image...</p>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">Upload an image</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, WebP or GIF up to {maxSizeInMB}MB
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
