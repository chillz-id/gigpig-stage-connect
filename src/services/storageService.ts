import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface StorageUploadOptions {
  cacheControl?: string;
  upsert?: boolean;
}

export interface StorageUploadResult {
  path: string;
  publicUrl: string;
}

export const storageService = {
  async getCurrentUserId(): Promise<string> {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error) throw error;
    if (!user) {
      throw new Error('User not authenticated');
    }

    return user.id as string;
  },

  async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options: StorageUploadOptions = {}
  ): Promise<StorageUploadResult> {
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: options.cacheControl ?? '3600',
        upsert: options.upsert ?? false,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabaseClient.storage.from(bucket).getPublicUrl(data.path);

    return {
      path: data.path as string,
      publicUrl: publicUrl as string,
    };
  },

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabaseClient.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  },
};

export type StorageService = typeof storageService;
