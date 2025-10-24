import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface OrganizationLogoUploadProps {
  currentLogoUrl?: string | null;
  onLogoUpdate: (logoUrl: string) => void;
}

export function OrganizationLogoUpload({ currentLogoUrl, onLogoUpdate }: OrganizationLogoUploadProps) {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, or WebP)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}/${Date.now()}.${fileExt}`;
      const filePath = `organization-logos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('organization-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('organization-media')
        .getPublicUrl(uploadData.path);

      // Update organization profile
      const { error: updateError } = await supabase
        .from('organization_profiles')
        .update({ logo_url: publicUrl })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      onLogoUpdate(publicUrl);

      toast({
        title: 'Logo uploaded',
        description: 'Your organization logo has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
      setPreviewUrl(currentLogoUrl || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!organization) return;

    try {
      setIsUploading(true);

      // Update organization profile
      const { error } = await supabase
        .from('organization_profiles')
        .update({ logo_url: null })
        .eq('id', organization.id);

      if (error) throw error;

      setPreviewUrl(null);
      onLogoUpdate('');

      toast({
        title: 'Logo removed',
        description: 'Your organization logo has been removed.',
      });
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast({
        title: 'Remove failed',
        description: error.message || 'Failed to remove logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Organization Logo</Label>
      <div className="flex items-center gap-4">
        {/* Logo Preview */}
        <div className="relative h-24 w-24 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Organization logo"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Camera className="h-8 w-8 text-gray-400" />
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <LoadingSpinner size="sm" className="text-white" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {previewUrl ? 'Change Logo' : 'Upload Logo'}
          </Button>
          {previewUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveLogo}
              disabled={isUploading}
            >
              <X className="mr-2 h-4 w-4" />
              Remove Logo
            </Button>
          )}
          <p className="text-xs text-gray-500">JPG, PNG or WebP. Max 5MB.</p>
        </div>
      </div>
    </div>
  );
}
