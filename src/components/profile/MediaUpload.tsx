import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Link, Youtube, HardDrive, X, Plus } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface MediaUploadProps {
  mediaType: 'photo' | 'video';
  onMediaAdded: () => void;
}

interface MediaData {
  title: string;
  description: string;
  tags: string[];
  isFeatured: boolean;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ mediaType, onMediaAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'youtube' | 'google_drive'>('file');
  const [mediaData, setMediaData] = useState<MediaData>({
    title: '',
    description: '',
    tags: [],
    isFeatured: false
  });
  const [externalUrl, setExternalUrl] = useState('');
  const [newTag, setNewTag] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const { uploadFile, isUploading: fileUploading } = useFileUpload({
    bucket: 'comedian-media',
    maxSize: mediaType === 'photo' ? 5 * 1024 * 1024 : 100 * 1024 * 1024, // 5MB for photos, 100MB for videos
    allowedTypes: mediaType === 'photo' 
      ? ['image/jpeg', 'image/png', 'image/webp']
      : ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi'],
    onProgress: setUploadProgress
  });

  const addTag = () => {
    if (newTag.trim() && !mediaData.tags.includes(newTag.trim())) {
      setMediaData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setMediaData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const extractGoogleDriveId = (url: string): string | null => {
    const regExp = /\/file\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      setIsUploading(true);
      
      // Upload file to storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const fileUrl = await uploadFile(file, fileName);
      
      // Save media record to database
      const { error } = await supabase
        .from('comedian_media')
        .insert({
          user_id: user.id,
          media_type: mediaType,
          title: mediaData.title || file.name,
          description: mediaData.description,
          file_url: fileUrl,
          file_size: file.size,
          file_type: file.type,
          tags: mediaData.tags,
          is_featured: mediaData.isFeatured
        });

      if (error) throw error;

      toast({
        title: "Media uploaded successfully",
        description: `Your ${mediaType} has been added to your portfolio.`
      });

      resetForm();
      onMediaAdded();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your media. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleExternalLink = async () => {
    if (!user || !externalUrl.trim()) return;

    try {
      setIsUploading(true);
      
      let externalType: string;
      let externalId: string | null;
      let thumbnailUrl: string | undefined;

      if (uploadMethod === 'youtube') {
        externalType = 'youtube';
        externalId = extractYouTubeId(externalUrl);
        if (!externalId) {
          toast({
            title: "Invalid YouTube URL",
            description: "Please enter a valid YouTube video URL.",
            variant: "destructive"
          });
          return;
        }
        thumbnailUrl = `https://img.youtube.com/vi/${externalId}/maxresdefault.jpg`;
      } else if (uploadMethod === 'google_drive') {
        externalType = 'google_drive';
        externalId = extractGoogleDriveId(externalUrl);
        if (!externalId) {
          toast({
            title: "Invalid Google Drive URL",
            description: "Please enter a valid Google Drive share URL.",
            variant: "destructive"
          });
          return;
        }
      } else {
        toast({
          title: "Invalid upload method",
          description: "Please select a valid upload method.",
          variant: "destructive"
        });
        return;
      }

      // Save media record to database
      const { error } = await supabase
        .from('comedian_media')
        .insert({
          user_id: user.id,
          media_type: mediaType,
          title: mediaData.title || `${uploadMethod} ${mediaType}`,
          description: mediaData.description,
          external_url: externalUrl,
          external_type: externalType,
          external_id: externalId,
          thumbnail_url: thumbnailUrl,
          tags: mediaData.tags,
          is_featured: mediaData.isFeatured
        });

      if (error) throw error;

      toast({
        title: "Media added successfully",
        description: `Your ${uploadMethod} ${mediaType} has been added to your portfolio.`
      });

      resetForm();
      onMediaAdded();
    } catch (error) {
      console.error('External link error:', error);
      toast({
        title: "Failed to add media",
        description: "There was an error adding your media. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setMediaData({
      title: '',
      description: '',
      tags: [],
      isFeatured: false
    });
    setExternalUrl('');
    setNewTag('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add {mediaType === 'photo' ? 'Photo' : 'Video'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-2">
              <Youtube className="w-4 h-4" />
              YouTube
            </TabsTrigger>
            <TabsTrigger value="google_drive" className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Google Drive
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-4">
            {/* Common fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={mediaData.title}
                  onChange={(e) => setMediaData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={`${mediaType} title`}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={mediaData.isFeatured}
                    onChange={(e) => setMediaData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  />
                  <span className="text-sm">Featured</span>
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={mediaData.description}
                onChange={(e) => setMediaData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={`Describe your ${mediaType}...`}
              />
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {mediaData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Upload method specific content */}
            <TabsContent value="file" className="mt-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept={mediaType === 'photo' ? 'image/*' : 'video/*'}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="w-full"
                  disabled={isUploading || fileUploading}
                />
                {(isUploading || fileUploading) && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {mediaType === 'photo' 
                    ? 'Supported: JPG, PNG, WebP (max 5MB)'
                    : 'Supported: MP4, WebM, MOV, AVI (max 100MB)'
                  }
                </p>
              </div>
            </TabsContent>

            <TabsContent value="youtube" className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="youtube-url">YouTube URL</Label>
                  <Input
                    id="youtube-url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <Button 
                  onClick={handleExternalLink} 
                  disabled={isUploading || !externalUrl.trim()}
                  className="w-full"
                >
                  Add YouTube Video
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="google_drive" className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="gdrive-url">Google Drive Share URL</Label>
                  <Input
                    id="gdrive-url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Make sure the file is set to "Anyone with the link can view"
                  </p>
                </div>
                <Button 
                  onClick={handleExternalLink} 
                  disabled={isUploading || !externalUrl.trim()}
                  className="w-full"
                >
                  Add Google Drive File
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};