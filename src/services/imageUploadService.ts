import { supabase } from '@/integrations/supabase/client';
import { processUploadedImage } from '@/utils/imageOptimization';
import { cleanupOldProfileImages } from '@/utils/profileImageCleanup';

export interface UploadOptions {
  bucket: string;
  userId: string;
  maxSize?: number;
  allowedTypes?: string[];
  optimize?: boolean;
  keepPreviousImages?: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  optimizedUrls?: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
  };
}

/**
 * Validates file before upload
 */
function validateFile(file: File, options: UploadOptions): string | null {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } = options;
  
  if (file.size > maxSize) {
    return `File size exceeds ${maxSize / 1024 / 1024}MB limit`;
  }
  
  if (!allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`;
  }
  
  return null;
}

/**
 * Compress image before upload if needed
 */
async function compressImage(file: File, quality: number = 0.9): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(file);
          return;
        }
        
        // Calculate dimensions maintaining aspect ratio
        const maxWidth = 2000;
        const maxHeight = 2000;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
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
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image with optimization
 */
export async function uploadImage(file: File, options: UploadOptions): Promise<UploadResult> {
  try {
    // Validate file
    const validationError = validateFile(file, options);
    if (validationError) {
      return { success: false, error: validationError };
    }
    
    // Compress if needed
    const fileToUpload = options.optimize !== false && file.size > 1024 * 1024 
      ? await compressImage(file, 0.85)
      : file;
    
    // Process and upload
    const { path, urls } = await processUploadedImage(fileToUpload, options.userId);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(path);
    
    // Cleanup old images if needed
    if (options.keepPreviousImages !== undefined) {
      await cleanupOldProfileImages(options.userId, path);
    }
    
    return {
      success: true,
      url: publicUrl,
      optimizedUrls: {
        thumbnail: urls.thumbnail,
        small: urls.small,
        medium: urls.medium,
        large: urls.large
      }
    };
  } catch (error) {
    console.error('Image upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Upload multiple images
 */
export async function uploadMultipleImages(
  files: File[],
  options: UploadOptions
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map(file => uploadImage(file, options))
  );
  
  return results;
}

/**
 * Delete image from storage
 */
export async function deleteImage(path: string, bucket: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      console.error('Failed to delete image:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Image deletion failed:', error);
    return false;
  }
}