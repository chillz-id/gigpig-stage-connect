import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { uploadImage, uploadMultipleImages, UploadOptions, UploadResult } from '@/services/imageUploadService';
import { useAuth } from '@/contexts/AuthContext';

export interface UseOptimizedFileUploadOptions {
  bucket: string;
  maxSize?: number;
  allowedTypes?: string[];
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
  optimize?: boolean;
  keepPreviousImages?: number;
  multiple?: boolean;
}

export function useOptimizedFileUpload(options: UseOptimizedFileUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadFile = useCallback(async (file: File): Promise<UploadResult | null> => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload files',
        variant: 'destructive'
      });
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const uploadOptions: UploadOptions = {
        bucket: options.bucket,
        userId: user.id,
        maxSize: options.maxSize,
        allowedTypes: options.allowedTypes,
        optimize: options.optimize,
        keepPreviousImages: options.keepPreviousImages
      };

      const result = await uploadImage(file, uploadOptions);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'File uploaded successfully'
        });
        options.onSuccess?.(result);
      } else {
        toast({
          title: 'Upload failed',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive'
        });
        options.onError?.(result.error || 'Upload failed');
      }

      return result;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
      options.onError?.(error instanceof Error ? error.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [user?.id, options, toast]);

  const uploadFiles = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload files',
        variant: 'destructive'
      });
      return [];
    }

    if (!options.multiple && files.length > 1) {
      toast({
        title: 'Error',
        description: 'Only one file can be uploaded at a time',
        variant: 'destructive'
      });
      return [];
    }

    setUploading(true);
    setProgress(0);

    try {
      const uploadOptions: UploadOptions = {
        bucket: options.bucket,
        userId: user.id,
        maxSize: options.maxSize,
        allowedTypes: options.allowedTypes,
        optimize: options.optimize
      };

      const results = await uploadMultipleImages(files, uploadOptions);
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        toast({
          title: 'Success',
          description: `${successful.length} file(s) uploaded successfully`
        });
        successful.forEach(result => options.onSuccess?.(result));
      }

      if (failed.length > 0) {
        toast({
          title: 'Some uploads failed',
          description: `${failed.length} file(s) failed to upload`,
          variant: 'destructive'
        });
        failed.forEach(result => options.onError?.(result.error || 'Upload failed'));
      }

      return results;
    } catch (error) {
      console.error('Batch upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
      return [];
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [user?.id, options, toast]);

  return {
    uploadFile,
    uploadFiles,
    uploading,
    progress
  };
}