import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Image, Link as LinkIcon, Crop } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { EventBannerImageEditor } from '@/components/events/EventBannerImageEditor';
import { useToast } from '@/hooks/use-toast';

interface EventBannerUploadProps {
  bannerUrl: string;
  bannerPosition?: { x: number; y: number; scale: number };
  onBannerChange: (data: { url: string; position: { x: number; y: number; scale: number } }) => void;
}

export const EventBannerUpload: React.FC<EventBannerUploadProps> = ({
  bannerUrl,
  bannerPosition = { x: 0, y: 0, scale: 1 },
  onBannerChange
}) => {
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [currentPosition, setCurrentPosition] = useState(bannerPosition);

  const { uploadFile, uploading } = useFileUpload({
    bucket: 'event-media',
    folder: 'banners',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Banner must be less than 10MB.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Upload original full-size image to storage
      const url = await uploadFile(file);
      if (url) {
        setUploadedImageUrl(url);
        setIsEditorOpen(true);
        setIsUploadDialogOpen(false);
      } else {
        toast({
          title: 'Upload failed',
          description: 'Failed to upload banner. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your banner.',
        variant: 'destructive'
      });
    }
  };

  const handleLinkSubmit = () => {
    if (linkUrl.trim()) {
      setUploadedImageUrl(linkUrl.trim());
      setIsEditorOpen(true);
      setIsUploadDialogOpen(false);
      setLinkUrl('');
    }
  };

  const handlePositionSave = (position: { x: number; y: number; scale: number }) => {
    setCurrentPosition(position);
    // Save both the URL and position
    onBannerChange({
      url: uploadedImageUrl || bannerUrl,
      position: position
    });
    setIsEditorOpen(false);
    setUploadedImageUrl('');

    toast({
      title: 'Banner updated',
      description: 'Your event banner has been updated successfully.'
    });
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setUploadedImageUrl('');
  };

  // Create a preview using CSS transform (matching how it will be displayed)
  const getBannerStyle = () => {
    if (!bannerUrl) return {};

    return {
      transform: `translate(${currentPosition.x}px, ${currentPosition.y}px) scale(${currentPosition.scale})`,
      transformOrigin: 'top left',
    };
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          Event Banner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                className="text-white border-white/30 hover:bg-white/10"
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Banner'}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-600 text-white">
              <DialogHeader>
                <DialogTitle>Upload Event Banner</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-input">From Computer</Label>
                  <Input
                    id="file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="link-input">From URL</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="link-input"
                      placeholder="https://example.com/image.jpg"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Button onClick={handleLinkSubmit} disabled={!linkUrl.trim()}>
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {bannerUrl && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setUploadedImageUrl(bannerUrl);
                setIsEditorOpen(true);
              }}
              className="text-white border-white/30 hover:bg-white/10"
            >
              <Crop className="w-4 h-4 mr-2" />
              Re-position
            </Button>
          )}
        </div>

        {bannerUrl && (
          <div className="mt-4">
            <div className="relative w-full aspect-[8/3] bg-black rounded-lg overflow-hidden border border-white/20">
              <img
                src={bannerUrl}
                alt="Event banner preview"
                style={getBannerStyle()}
                className="absolute top-0 left-0"
              />
            </div>
          </div>
        )}

        <p className="text-sm text-gray-300">
          Recommended size: 1200×450px (8:3 ratio). Drag to reposition after upload.
        </p>

        <EventBannerImageEditor
          isOpen={isEditorOpen}
          onClose={handleEditorClose}
          onSave={handlePositionSave}
          imageUrl={uploadedImageUrl || bannerUrl}
          initialPosition={currentPosition}
        />
      </CardContent>
    </Card>
  );
};
