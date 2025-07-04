
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseFileUploadOptions {
  bucket: 'event-media' | 'profile-images' | 'comedian-media';
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
}

export const useFileUpload = ({
  bucket,
  folder,
  maxSize = 50 * 1024 * 1024, // 50MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'],
  onProgress
}: UseFileUploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file) return null;


    // Validate file size
    if (file.size > maxSize) {
      console.error('File too large:', file.size, 'max:', maxSize);
      toast({
        title: "File too large",
        description: `File must be smaller than ${Math.round(maxSize / 1024 / 1024)}MB`,
        variant: "destructive"
      });
      return null;
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type, 'allowed:', allowedTypes);
      toast({
        title: "Invalid file type",
        description: `Only ${allowedTypes.join(', ')} files are allowed`,
        variant: "destructive"
      });
      return null;
    }

    setUploading(true);
    setUploadProgress(0);
    onProgress?.(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;


      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }


      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);


      setUploadProgress(100);
      onProgress?.(100);
      
      toast({
        title: "Upload successful",
        description: "File has been uploaded successfully"
      });

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }


      toast({
        title: "File deleted",
        description: "File has been deleted successfully"
      });

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    uploadProgress
  };
};
