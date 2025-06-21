/**
 * Avatar Utilities
 * Helper functions for avatar generation and management
 */

/**
 * Generate a deterministic color based on user ID or name
 */
function generateColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

/**
 * Generate default avatar URL using DiceBear API
 */
export function generateDefaultAvatar(
  seed: string,
  style: 'avataaars' | 'bottts' | 'identicon' | 'initials' = 'initials',
  size: number = 200
): string {
  const baseUrl = 'https://api.dicebear.com/7.x';
  const encodedSeed = encodeURIComponent(seed);
  
  switch (style) {
    case 'initials':
      const color = generateColor(seed);
      const bgColor = color.replace('hsl(', '').replace(')', '').replace(/,\s*/g, ',');
      return `${baseUrl}/initials/svg?seed=${encodedSeed}&backgroundColor=${encodeURIComponent(bgColor)}&size=${size}`;
    
    case 'avataaars':
      return `${baseUrl}/avataaars/svg?seed=${encodedSeed}&size=${size}`;
    
    case 'bottts':
      return `${baseUrl}/bottts/svg?seed=${encodedSeed}&size=${size}`;
    
    case 'identicon':
      return `${baseUrl}/identicon/svg?seed=${encodedSeed}&size=${size}`;
    
    default:
      return `${baseUrl}/initials/svg?seed=${encodedSeed}&size=${size}`;
  }
}

/**
 * Get avatar URL with fallback to generated avatar
 */
export function getAvatarUrl(
  userAvatarUrl: string | null | undefined,
  fallbackSeed: string,
  size: number = 200
): string {
  if (userAvatarUrl && userAvatarUrl.trim()) {
    return userAvatarUrl;
  }
  
  return generateDefaultAvatar(fallbackSeed, 'initials', size);
}

/**
 * Extract initials from a name
 */
export function getInitials(name: string, maxLength: number = 2): string {
  if (!name || !name.trim()) {
    return '??';
  }

  // Split on whitespace first to get main word groups
  const mainWords = name.trim().split(/\s+/);
  
  if (mainWords.length === 1) {
    // Single word - check if it has apostrophe like "O'Brien"
    const word = mainWords[0];
    if (word.includes("'")) {
      // Split on apostrophe and take first letter of each part
      const parts = word.split("'").filter(part => part.length > 0);
      return parts
        .slice(0, maxLength)
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase();
    }
    // Regular single word - use first two characters
    return word.substring(0, maxLength).toUpperCase();
  }
  
  // Multiple main words - use first letter of each main word
  // For hyphenated first names like "Jean-Paul", take just the first letter
  return mainWords
    .slice(0, maxLength)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * Validate image file for avatar upload
 */
export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'File must be a JPEG, PNG, or WebP image'
    };
  }

  // Check file size (2MB limit)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 2MB'
    };
  }

  // Basic validation passed
  return { valid: true };
}

/**
 * Validate image file for avatar upload (async version for full validation)
 */
export function validateAvatarFileAsync(file: File): Promise<{ valid: boolean; error?: string }> {
  // First do synchronous validation
  const syncResult = validateAvatarFile(file);
  if (!syncResult.valid) {
    return Promise.resolve(syncResult);
  }

  // Then check if it's actually an image by creating an Image object
  return new Promise<{ valid: boolean; error?: string }>((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: true });
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({
        valid: false,
        error: 'File is not a valid image'
      });
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resize image to specified dimensions while maintaining aspect ratio
 */
export function resizeImage(
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Create a circular crop of an image
 */
export function createCircularCrop(
  file: File,
  size: number = 200,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;

      // Create circular clip path
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      // Calculate crop dimensions (square crop from center)
      const minDimension = Math.min(img.width, img.height);
      const cropX = (img.width - minDimension) / 2;
      const cropY = (img.height - minDimension) / 2;

      // Draw cropped image
      ctx.drawImage(
        img,
        cropX, cropY, minDimension, minDimension,
        0, 0, size, size
      );

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create circular crop'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}