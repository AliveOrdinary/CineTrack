'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client'; // Import createClient
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button"; 
import { Upload } from 'lucide-react'; 

interface AvatarUploadProps {
  url: string | null;
  name?: string; 
  email?: string; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onUpload: (file: File) => Promise<string>; 
}

export default function AvatarUpload({ 
  url, 
  name,
  email,
  size = 'lg',
  onUpload
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sizeClasses = {
    // ... size classes ...
  };
  const iconSizeClasses = {
    // ... icon size classes ...
  };

  useEffect(() => {
    setAvatarUrl(url);
  }, [url]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Use the passed-in onUpload function
      const newUrl = await onUpload(file);
      setAvatarUrl(newUrl);
    } catch (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    if (name) {
      const nameParts = name.split(' ');
      return nameParts.length > 1 ? nameParts[0][0] + nameParts[1][0] : nameParts[0][0];
    }
    return 'U';
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className={`${sizeClasses[size]} border border-gray-600 relative group`}>
        <AvatarImage src={avatarUrl || undefined} alt={name || 'User Avatar'} />
        <AvatarFallback>{getInitials()}</AvatarFallback>
        <label htmlFor="single" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer rounded-full">
          <Upload className={`text-white ${iconSizeClasses[size]}`} />
        </label>
      </Avatar>
      
      <input
        style={{ visibility: 'hidden', position: 'absolute' }} 
        type="file"
        id="single"
        accept="image/png, image/jpeg, image/gif, image/webp"
        onChange={handleUpload}
        disabled={uploading}
      />
      
      <Button asChild variant="outline" size="sm" disabled={uploading}> 
         <label htmlFor="single" className="cursor-pointer">
           {uploading ? 'Uploading...' : 'Upload Image'}
         </label>
      </Button>
      
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
