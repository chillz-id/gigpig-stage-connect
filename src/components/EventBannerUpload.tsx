
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Image, Link, Crop } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { EventImageCrop } from '@/components/EventImageCrop';

interface EventBannerUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

export const EventBannerUpload: React.FC<EventBannerUploadProps> = ({
  imageUrl,
  onImageChange
}) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  const { uploadFile, uploading } = useFileUpload({
    bucket: 'event-media',
    folder: 'banners',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = await uploadFile(file);
      if (url) {
        setUploadedImageUrl(url);
        setIsCropDialogOpen(true);
        setIsUploadDialogOpen(false);
      } else {
        console.error('File upload failed');
      }
    }
  };

  const handleLinkSubmit = () => {
    if (linkUrl.trim()) {
      setUploadedImageUrl(linkUrl.trim());
      setIsCropDialogOpen(true);
      setIsUploadDialogOpen(false);
      setLinkUrl('');
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    onImageChange(croppedImageUrl);
    setIsCropDialogOpen(false);
    setUploadedImageUrl('');
  };

  const handleCropClose = () => {
    setIsCropDialogOpen(false);
    setUploadedImageUrl('');
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
                variant="outline" 
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
                    accept="image/*"
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
                      <Link className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {imageUrl && (
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                setUploadedImageUrl(imageUrl);
                setIsCropDialogOpen(true);
              }}
              className="text-white border-white/30 hover:bg-white/10"
            >
              <Crop className="w-4 h-4 mr-2" />
              Re-crop
            </Button>
          )}
        </div>

        {imageUrl && (
          <div className="mt-4">
            <img 
              src={imageUrl} 
              alt="Event banner preview" 
              className="w-full max-w-md h-auto aspect-video object-cover rounded-lg border border-white/20"
            />
          </div>
        )}

        <p className="text-sm text-gray-300">
          Recommended size: 1920x1080px. Images will be cropped to this aspect ratio.
        </p>

        <EventImageCrop
          isOpen={isCropDialogOpen}
          onClose={handleCropClose}
          onCrop={handleCropComplete}
          imageUrl={uploadedImageUrl}
        />
      </CardContent>
    </Card>
  );
};
