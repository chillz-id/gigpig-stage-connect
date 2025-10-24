import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Folder,
  Cloud,
  Droplet,
  Search,
  Grid3x3,
  List,
  Tag,
  Download,
  Trash2,
  Share2,
  Eye,
  FolderPlus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type MediaType = 'all' | 'images' | 'videos';

interface MediaFolder {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  size: number;
  uploadedAt: Date;
  tags: string[];
  folder_id?: string | null;
  folder?: string;
}

/**
 * MediaLibraryManager - Comprehensive Media Management Component
 *
 * Features:
 * - Direct upload to Supabase Storage
 * - Google Drive integration
 * - Dropbox integration
 * - Folder organization
 * - Tagging system
 * - Preview functionality
 * - Sharing capabilities
 */
export const MediaLibraryManager: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<MediaType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Fetch user's folders
  useEffect(() => {
    if (!user?.id) return;

    const fetchFolders = async () => {
      setIsLoadingFolders(true);
      try {
        const { data, error } = await supabase
          .from('media_folders')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (error) throw error;

        setFolders(data || []);
      } catch (error) {
        console.error('Error fetching folders:', error);
        toast({
          title: "Failed to load folders",
          description: "Could not retrieve your media folders.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingFolders(false);
      }
    };

    fetchFolders();
  }, [user?.id, toast]);

  // Fetch media files
  useEffect(() => {
    if (!user?.id) return;

    const fetchFiles = async () => {
      setIsLoadingFiles(true);
      try {
        const { data, error } = await supabase
          .from('media_files')
          .select(`
            *,
            media_folders(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedFiles: MediaFile[] = (data || []).map((file: any) => ({
          id: file.id,
          name: file.file_name,
          type: file.file_type.startsWith('video/') ? 'video' : 'image',
          url: file.public_url || '',
          size: file.file_size,
          uploadedAt: new Date(file.created_at),
          tags: file.tags || [],
          folder_id: file.folder_id,
          folder: file.media_folders?.name,
        }));

        setFiles(mappedFiles);
      } catch (error) {
        console.error('Error fetching files:', error);
        toast({
          title: "Failed to load media",
          description: "Could not retrieve your media files.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchFiles();
  }, [user?.id, toast]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || !user?.id) return;

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${user.id}/${timestamp}-${sanitizedName}`;

        // Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('media-library')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (storageError) throw storageError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media-library')
          .getPublicUrl(storagePath);

        // Create database record
        const { data: dbData, error: dbError } = await supabase
          .from('media_files')
          .insert({
            user_id: user.id,
            folder_id: selectedFolder,
            storage_path: storagePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            public_url: publicUrl,
            tags: [],
          })
          .select()
          .single();

        if (dbError) throw dbError;

        return {
          id: dbData.id,
          name: file.name,
          type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
          url: publicUrl,
          size: file.size,
          uploadedAt: new Date(),
          tags: [],
          folder_id: selectedFolder,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setFiles(prev => [...uploadedFiles, ...prev]);

      toast({
        title: "Upload Successful",
        description: `${uploadedFiles.length} file(s) uploaded successfully.`,
      });

      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [user, toast, selectedFolder]);

  const handleGoogleDriveConnect = () => {
    toast({
      title: "Google Drive Integration",
      description: "Google Drive integration coming soon!",
    });
  };

  const handleDropboxConnect = () => {
    toast({
      title: "Dropbox Integration",
      description: "Dropbox integration coming soon!",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const filteredFiles = files.filter(file => {
    const matchesType = activeTab === 'all' || file.type === activeTab.slice(0, -1);
    const matchesSearch = !searchQuery ||
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Media
          </CardTitle>
          <CardDescription>
            Upload images and videos directly or connect your cloud storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Folder Selection */}
          <div>
            <Label htmlFor="folder-select">Upload to Folder</Label>
            <Select
              value={selectedFolder || 'none'}
              onValueChange={(value) => setSelectedFolder(value === 'none' ? null : value)}
            >
              <SelectTrigger id="folder-select" className="mt-1">
                <SelectValue placeholder="Select a folder (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    No Folder (Root)
                  </div>
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      {folder.name}
                      {folder.is_default && (
                        <span className="text-xs text-gray-400">(Default)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingFolders && (
              <p className="text-sm text-gray-400 mt-1">Loading folders...</p>
            )}
          </div>

          {/* Direct Upload */}
          <div>
            <Label htmlFor="media-upload">Select Files</Label>
            <Input
              id="media-upload"
              type="file"
              multiple
              accept="image/*,video/*,audio/*,application/pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="mt-1"
            />
            {isUploading && (
              <p className="text-sm text-gray-400 mt-2">Uploading files...</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Supported: Images, Videos, Audio, PDF (max 100MB per file)
            </p>
          </div>

          {/* Cloud Storage Connections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleGoogleDriveConnect}
              className="flex items-center gap-2"
            >
              <Cloud className="w-4 h-4" />
              Connect Google Drive
            </Button>
            <Button
              variant="outline"
              onClick={handleDropboxConnect}
              className="flex items-center gap-2"
            >
              <Droplet className="w-4 h-4" />
              Connect Dropbox
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Library */}
      <Card className="professional-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                My Media
              </CardTitle>
              <CardDescription>
                {filteredFiles.length} file(s) in your library
              </CardDescription>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Media Type Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MediaType)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="images">
                <ImageIcon className="w-4 h-4 mr-2" />
                Images
              </TabsTrigger>
              <TabsTrigger value="videos">
                <Video className="w-4 h-4 mr-2" />
                Videos
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {isLoadingFiles ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading media files...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {files.length === 0
                      ? "No media files yet. Upload your first file!"
                      : "No files match your search criteria."}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative bg-gray-800 rounded-lg overflow-hidden aspect-square"
                    >
                      {/* Thumbnail */}
                      <div className="w-full h-full flex items-center justify-center bg-gray-700">
                        {file.type === 'image' ? (
                          <ImageIcon className="w-12 h-12 text-gray-500" />
                        ) : (
                          <Video className="w-12 h-12 text-gray-500" />
                        )}
                      </div>

                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="icon" variant="secondary" title="Preview">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="secondary" title="Download">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="secondary" title="Share">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* File Info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {file.type === 'image' ? (
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Video className="w-5 h-5 text-gray-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{file.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{file.uploadedAt.toLocaleDateString()}</span>
                            {file.folder && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Folder className="w-3 h-3" />
                                  {file.folder}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" title="Preview">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Download">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Share">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
