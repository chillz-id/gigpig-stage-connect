import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { BannerImageEditor } from './BannerImageEditor';

interface BannerUploadProps {
  onBannerUploaded: (bannerUrl: string) => void;
  currentBannerUrl?: string | null;
}

export const BannerUpload: React.FC<BannerUploadProps> = ({
  onBannerUploaded,
  currentBannerUrl
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [bannerPosition, setBannerPosition] = useState<{ x: number; y: number; scale: number }>({ x: 0, y: 0, scale: 1 });

  const { uploadFile } = useFileUpload({
    bucket: 'comedian-media',
    folder: `${user?.id}/Banner`,
    maxSize: 10 * 1024 * 1024, // 10MB max
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    onProgress: setUploadProgress
  });

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPG, PNG, or WebP image.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Banner image must be less than 10MB.',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);

    // Create preview and open editor
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setShowEditor(true);
    };
    reader.readAsDataURL(file);
  };

  const handlePositionSave = (position: { x: number; y: number; scale: number }) => {
    setBannerPosition(position);
    setShowEditor(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setBannerPosition({ x: 0, y: 0, scale: 1 });
  };

  const handleUpload = async () => {
    if (!user || !selectedFile) return;

    try {
      setIsUploading(true);

      // Upload file to Banner folder
      const fileUrl = await uploadFile(selectedFile);

      if (!fileUrl) {
        toast({
          title: 'Upload failed',
          description: 'Failed to upload banner image. Please try again.',
          variant: 'destructive'
        });
        setIsUploading(false);
        return;
      }

      // Update profiles table with new banner URL and position
      const { error } = await supabase
        .from('profiles')
        .update({
          banner_url: fileUrl,
          banner_position: bannerPosition // Save the position from editor
        })
        .eq('id', user.id);

      if (error) {
        console.error('Database update error:', error);
        toast({
          title: 'Failed to save banner',
          description: 'The image was uploaded but failed to save. Please try again.',
          variant: 'destructive'
        });
        setIsUploading(false);
        return;
      }

      toast({
        title: 'Banner uploaded successfully',
        description: 'Your profile banner has been updated.'
      });

      onBannerUploaded(fileUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your banner. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Banner Preview */}
      {currentBannerUrl && !selectedFile && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Banner</label>
          <div className="relative aspect-[8/3] rounded-lg overflow-hidden border border-border">
            <img
              src={currentBannerUrl}
              alt="Current banner"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
        <input
          type="file"
          id="banner-upload-input"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelection}
          className="hidden"
          disabled={isUploading}
        />
        <label htmlFor="banner-upload-input">
          <Button
            type="button"
            onClick={() => document.getElementById('banner-upload-input')?.click()}
            disabled={isUploading}
            className="professional-button"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Banner Image
          </Button>
        </label>
        <p className="text-sm text-gray-500 mt-2">
          Recommended: 1200x450px (8:3 ratio)
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Supported: JPG, PNG, WebP (max 10MB)
        </p>
      </div>

      {/* Selected File Preview */}
      {selectedFile && previewUrl && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Selected Image</label>
          <div className="relative">
            <div className="aspect-[8/3] rounded-lg overflow-hidden border border-border">
              <img
                src={previewUrl}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeFile}
              disabled={isUploading}
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm truncate">{selectedFile.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full professional-button"
          >
            {isUploading ? (
              <span>Uploading... {Math.round(uploadProgress)}%</span>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Banner
              </>
            )}
          </Button>
        </div>
      )}

      {/* Banner Position Editor */}
      {showEditor && previewUrl && (
        <BannerImageEditor
          isOpen={showEditor}
          onClose={() => setShowEditor(false)}
          onSave={handlePositionSave}
          imageUrl={previewUrl}
          initialPosition={bannerPosition}
        />
      )}
    </div>
  );
};
