import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Eye,
  FolderPlus,
  Lock,
  Edit2,
  Star,
  FolderInput,
  FileText,
  UserCircle,
} from 'lucide-react';
import { EditMediaTitleDialog } from '@/components/comedian-profile/EditMediaTitleDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { MediaTagInput, MediaTagDisplay, MediaTagFilter } from '@/components/media-library';
import { useMediaTags } from '@/hooks/useMediaTags';

type ViewMode = 'grid' | 'list';
type MediaType = 'images' | 'videos';

interface MediaFolder {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_system_folder: boolean;
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
  is_headshot?: boolean;
  is_primary_headshot?: boolean;
  external_url?: string | null;
  external_type?: string | null;
  external_id?: string | null;
  is_featured_in_epk?: boolean;
  is_profile_video?: boolean;
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
  const { isMobile, isSmallMobile } = useMobileLayout();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<MediaType>('images');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaFile | null>(null);
  const [showHeadshotsOnly, setShowHeadshotsOnly] = useState(false);
  const [showAddVideoUrl, setShowAddVideoUrl] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaFile | null>(null);
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);

  // Tag management hook
  const { updateMediaTags, isUpdating: isUpdatingTags } = useMediaTags();

  // Tag filter helpers
  const toggleFilterTag = useCallback((tag: string) => {
    setSelectedFilterTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const clearFilterTags = useCallback(() => {
    setSelectedFilterTags([]);
  }, []);

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
          type: file.file_type === 'video' || file.file_type?.startsWith('video/') ? 'video' : 'image',
          url: file.public_url || file.external_url || '',
          size: file.file_size,
          uploadedAt: new Date(file.created_at),
          tags: file.tags || [],
          folder_id: file.folder_id,
          folder: file.media_folders?.name,
          is_headshot: file.is_headshot || false,
          is_primary_headshot: file.is_primary_headshot || false,
          external_url: file.external_url,
          external_type: file.external_type,
          external_id: file.external_id,
          is_featured_in_epk: file.is_featured_in_epk || false,
          is_profile_video: file.is_profile_video || false,
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

  const handleCreateFolder = async () => {
    if (!user?.id || !newFolderName.trim()) return;

    // Prevent creating folders with reserved names
    if (newFolderName.trim().toLowerCase() === 'headshots') {
      toast({
        title: "Reserved Folder Name",
        description: "The name 'Headshots' is reserved for system use. Please choose a different name.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingFolder(true);
    try {
      const { data, error } = await supabase
        .from('media_folders')
        .insert({
          user_id: user.id,
          name: newFolderName.trim(),
          is_default: false,
          is_system_folder: false,
        })
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [...prev, data]);
      setSelectedFolder(data.id);
      setNewFolderName('');
      setShowCreateFolderDialog(false);

      toast({
        title: "Folder Created",
        description: `Folder "${data.name}" created successfully.`,
      });
    } catch (error: any) {
      console.error('Create folder error:', error);
      toast({
        title: "Failed to Create Folder",
        description: error.message || "Could not create folder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleReassignToFolder = async (fileId: string, newFolderId: string | null) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('media_files')
        .update({ folder_id: newFolderId })
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setFiles(prev => prev.map(file =>
        file.id === fileId
          ? {
            ...file,
            folder_id: newFolderId,
            folder: newFolderId ? folders.find(f => f.id === newFolderId)?.name : undefined
          }
          : file
      ));

      const folderName = newFolderId ? folders.find(f => f.id === newFolderId)?.name : "No folder";
      toast({
        title: "Folder Updated",
        description: `File moved to "${folderName}".`,
      });
    } catch (error: any) {
      console.error('Reassign folder error:', error);
      toast({
        title: "Failed to Move File",
        description: error.message || "Could not move file to new folder. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleHeadshot = async (fileId: string, currentStatus: boolean) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('media_files')
        .update({ is_headshot: !currentStatus })
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setFiles(prev => prev.map(file =>
        file.id === fileId
          ? { ...file, is_headshot: !currentStatus }
          : file
      ));

      toast({
        title: currentStatus ? "Unmarked as Headshot" : "Marked as Headshot",
        description: currentStatus
          ? "File removed from headshots collection."
          : "File added to headshots collection for automation use.",
      });
    } catch (error: any) {
      console.error('Toggle headshot error:', error);
      toast({
        title: "Failed to Update Headshot",
        description: error.message || "Could not update headshot status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleEPKFeatured = async (fileId: string, currentStatus: boolean) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.rpc('toggle_epk_featured', {
        p_user_id: user.id,
        p_file_id: fileId,
        p_is_featured: !currentStatus
      });

      if (error) throw error;

      // Update local state
      setFiles(prev => prev.map(file =>
        file.id === fileId
          ? { ...file, is_featured_in_epk: !currentStatus }
          : file
      ));

      toast({
        title: currentStatus ? "Removed from EPK" : "Featured in EPK",
        description: currentStatus
          ? "Media removed from Electronic Press Kit."
          : "Media will now be displayed in your EPK.",
      });
    } catch (error: any) {
      console.error('Toggle EPK featured error:', error);
      toast({
        title: "Failed to Update EPK Status",
        description: error.message || "Could not update EPK status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSetProfileVideo = async (fileId: string, isCurrentlyProfileVideo: boolean) => {
    if (!user?.id) return;

    // If already profile video, we're unsetting it
    if (isCurrentlyProfileVideo) {
      try {
        const { error } = await supabase
          .from('media_files')
          .update({ is_profile_video: false })
          .eq('id', fileId)
          .eq('user_id', user.id);

        if (error) throw error;

        setFiles(prev => prev.map(file =>
          file.id === fileId
            ? { ...file, is_profile_video: false }
            : file
        ));

        toast({
          title: "Profile Video Removed",
          description: "This video is no longer your profile video.",
        });
      } catch (error: any) {
        console.error('Unset profile video error:', error);
        toast({
          title: "Failed to Update Profile Video",
          description: error.message || "Could not update profile video. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    // Setting a new profile video
    try {
      const { error } = await supabase.rpc('set_profile_video', {
        p_user_id: user.id,
        p_file_id: fileId
      });

      if (error) throw error;

      // Update local state - unset any existing profile video and set new one
      setFiles(prev => prev.map(file =>
        file.id === fileId
          ? { ...file, is_profile_video: true }
          : { ...file, is_profile_video: false }
      ));

      toast({
        title: "Profile Video Set",
        description: "This video is now your profile video.",
      });
    } catch (error: any) {
      console.error('Set profile video error:', error);
      toast({
        title: "Failed to Set Profile Video",
        description: error.message || "Could not set profile video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (file: MediaFile) => {
    setPreviewMedia(file);
  };

  const handleDownload = async (file: MediaFile) => {
    try {
      // For external URLs, open in new tab
      if (file.external_url) {
        window.open(file.external_url, '_blank');
        return;
      }

      // For uploaded files, download from storage
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: `Downloading ${file.name}`,
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Could not download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (file: MediaFile) => {
    if (!user?.id) return;

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${file.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from storage if it's an uploaded file (not external)
      if (!file.external_url && file.url) {
        const filePath = file.url.split('/').pop();
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('media-library')
            .remove([`${user.id}/${filePath}`]);

          if (storageError) {
            console.warn('Storage deletion warning:', storageError);
            // Continue with database deletion even if storage fails
          }
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', file.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setFiles(prev => prev.filter(f => f.id !== file.id));

      toast({
        title: "File Deleted",
        description: `${file.name} has been permanently deleted.`,
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Could not delete file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddExternalVideo = async () => {
    if (!user?.id || !videoUrl.trim()) return;

    setIsAddingVideo(true);
    try {
      // Call the add_external_video database function
      const { data, error } = await supabase.rpc('add_external_video', {
        p_user_id: user.id,
        p_url: videoUrl.trim(),
        p_title: videoTitle.trim() || 'External Video',
        p_folder_id: selectedFolder,
        p_is_featured_in_epk: false,
        p_is_profile_video: false
      });

      if (error) throw error;

      toast({
        title: "Video Added",
        description: "External video has been added to your media library.",
      });

      // Reset form
      setVideoUrl('');
      setVideoTitle('');
      setShowAddVideoUrl(false);

      // Refresh files list
      const { data: filesData, error: filesError } = await supabase
        .from('media_files')
        .select(`
          *,
          media_folders(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filesError) throw filesError;

      const mappedFiles: MediaFile[] = (filesData || []).map((file: any) => ({
        id: file.id,
        name: file.file_name,
        type: file.file_type === 'video' || file.file_type?.startsWith('video/') ? 'video' : 'image',
        url: file.public_url || file.external_url || '',
        size: file.file_size,
        uploadedAt: new Date(file.created_at),
        tags: file.tags || [],
        folder_id: file.folder_id,
        folder: file.media_folders?.name,
        is_headshot: file.is_headshot || false,
        is_primary_headshot: file.is_primary_headshot || false,
        external_url: file.external_url,
        external_type: file.external_type,
        external_id: file.external_id,
        is_featured_in_epk: file.is_featured_in_epk || false,
        is_profile_video: file.is_profile_video || false,
      }));

      setFiles(mappedFiles);
    } catch (error: any) {
      console.error('Add external video error:', error);
      toast({
        title: "Failed to Add Video",
        description: error.message || "Could not add external video. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingVideo(false);
    }
  };

  const handleUpdateName = async (fileId: string, newName: string) => {
    if (!user?.id || !newName.trim()) return;

    try {
      const { error } = await supabase
        .from('media_files')
        .update({ name: newName.trim() })
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setFiles(prev => prev.map(file =>
        file.id === fileId
          ? { ...file, name: newName.trim() }
          : file
      ));

      toast({
        title: "Name Updated",
        description: "Media file name has been updated successfully.",
      });

      setEditingMedia(null);
    } catch (error: any) {
      console.error('Update name error:', error);
      toast({
        title: "Failed to Update Name",
        description: error.message || "Could not update media name. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const filteredFiles = files.filter(file => {
    // activeTab is 'images' or 'videos', file.type is 'image' or 'video'
    const matchesType = file.type === activeTab.slice(0, -1);
    const matchesSearch = !searchQuery ||
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesHeadshotFilter = !showHeadshotsOnly || file.is_headshot === true;
    const matchesTagFilter = selectedFilterTags.length === 0 ||
      selectedFilterTags.every(tag => file.tags?.includes(tag));
    return matchesType && matchesSearch && matchesHeadshotFilter && matchesTagFilter;
  });

  // Helper to update tags for a file
  const handleTagsChange = async (fileId: string, newTags: string[]) => {
    try {
      await updateMediaTags(fileId, newTags);
      // Update local state after successful save
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, tags: newTags } : f
      ));
    } catch (error) {
      // Toast is shown by the hook
      console.error('Failed to update tags:', error);
    }
  };

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4")}>
      {/* Upload Section */}
      <Card className="professional-card">
        <CardHeader className={cn(isMobile && "px-4 py-3")}>
          <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
            <Upload className={cn(isMobile ? "w-5 h-5" : "w-5 h-5")} />
            Upload Media
          </CardTitle>
          <CardDescription className={cn(isMobile && "text-sm")}>
            {isMobile ? "Upload or connect cloud storage" : "Upload images and videos directly or connect your cloud storage"}
          </CardDescription>
        </CardHeader>
        <CardContent className={cn("space-y-4", isMobile && "px-4 space-y-3")}>
          {/* Folder Selection */}
          <div>
            <Label htmlFor="folder-select" className={cn(isMobile && "text-sm")}>Upload to Folder</Label>
            <Select
              value={selectedFolder || 'none'}
              onValueChange={(value) => {
                if (value === 'create-new') {
                  setShowCreateFolderDialog(true);
                } else {
                  setSelectedFolder(value === 'none' ? null : value);
                }
              }}
            >
              <SelectTrigger id="folder-select" className={cn("mt-1", isMobile && "h-11 touch-target-44")}>
                <SelectValue placeholder="Select a folder (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    No Folder
                  </div>
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      {folder.is_system_folder ? (
                        <Lock className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Folder className="w-4 h-4" />
                      )}
                      {folder.name}
                      {folder.is_default && (
                        <span className="text-xs text-gray-400">(Default)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="create-new" className="text-purple-400">
                  <div className="flex items-center gap-2">
                    <FolderPlus className="w-4 h-4" />
                    Create New Folder
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {isLoadingFolders && (
              <p className="text-sm text-gray-400 mt-1">Loading folders...</p>
            )}
          </div>

          {/* Direct Upload */}
          <div>
            <Label htmlFor="media-upload" className={cn(isMobile && "text-sm")}>Upload Files</Label>
            <Input
              id="media-upload"
              type="file"
              multiple
              accept="image/*,video/*,audio/*,application/pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
              className={cn("mt-1", isMobile && "h-11 touch-target-44")}
            />
            {isUploading && (
              <p className="text-sm text-gray-400 mt-2">Uploading files...</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {isMobile ? "Images, Videos, Audio, PDF (max 100MB)" : "Supported: Images, Videos, Audio, PDF (max 100MB per file)"}
            </p>
          </div>

          {/* Add Video URL */}
          <div className="pt-4 border-t">
            <Button
              onClick={() => setShowAddVideoUrl(true)}
              className={cn("w-full flex items-center justify-center gap-2", isMobile && "h-11 touch-target-44")}
              variant="secondary"
            >
              <Video className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
              {isMobile ? "Add Video URL" : "Add YouTube / Vimeo URL"}
            </Button>
          </div>

          {/* Cloud Storage Connections */}
          <div className={cn("grid gap-4 pt-4 border-t", isMobile ? "grid-cols-1 gap-2" : "grid-cols-1 sm:grid-cols-2")}>
            <Button
              onClick={handleGoogleDriveConnect}
              className={cn("flex items-center gap-2", isMobile && "h-11 touch-target-44 w-full")}
              variant="secondary"
            >
              <Cloud className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
              {isMobile ? "Google Drive" : "Connect Google Drive"}
            </Button>
            <Button
              onClick={handleDropboxConnect}
              className={cn("flex items-center gap-2", isMobile && "h-11 touch-target-44 w-full")}
              variant="secondary"
            >
              <Droplet className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
              {isMobile ? "Dropbox" : "Connect Dropbox"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Library */}
      <Card className="professional-card">
        <CardHeader className={cn(isMobile && "px-4 py-3")}>
          <div className={cn(
            "flex gap-4",
            isMobile ? "flex-col" : "flex-col sm:flex-row sm:items-center sm:justify-between"
          )}>
            <div>
              <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
                <Folder className={cn(isMobile ? "w-5 h-5" : "w-5 h-5")} />
                My Media
              </CardTitle>
              <CardDescription className={cn(isMobile && "text-sm")}>
                {filteredFiles.length} file(s) in your library
              </CardDescription>
            </div>

            {/* View Controls */}
            <div className={cn("flex items-center gap-2", isMobile && "justify-between")}>
              <MediaTagFilter
                selectedTags={selectedFilterTags}
                onTagToggle={toggleFilterTag}
                onClear={clearFilterTags}
                className={cn(isMobile && "touch-target-44")}
              />
              <Button
                className={cn(
                  showHeadshotsOnly ? '' : 'professional-button',
                  isMobile && "touch-target-44"
                )}
                variant={showHeadshotsOnly ? 'default' : 'secondary'}
                size={isMobile ? "default" : "sm"}
                onClick={() => setShowHeadshotsOnly(!showHeadshotsOnly)}
                title={showHeadshotsOnly ? "Show all media" : "Show headshots only"}
              >
                <Star className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2", showHeadshotsOnly && "fill-yellow-300")} />
                {showHeadshotsOnly ? 'Headshots' : 'All'}
              </Button>
              <div className="h-6 w-px bg-gray-700" />
              <Button
                className={cn(
                  viewMode === 'grid' ? '' : 'professional-button',
                  isMobile && "touch-target-44"
                )}
                variant={viewMode === 'grid' ? 'default' : undefined}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
              </Button>
              <Button
                className={cn(
                  viewMode === 'list' ? '' : 'professional-button',
                  isMobile && "touch-target-44"
                )}
                variant={viewMode === 'list' ? 'default' : undefined}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn(isMobile && "px-4")}>
          {/* Search Bar */}
          <div className={cn(isMobile ? "mb-3" : "mb-4")}>
            <div className="relative">
              <Search className={cn(
                "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400",
                isMobile ? "w-5 h-5" : "w-4 h-4"
              )} />
              <Input
                type="text"
                placeholder={isMobile ? "Search media..." : "Search by name or tags..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("pl-10", isMobile && "h-11 touch-target-44")}
              />
            </div>
          </div>

          {/* Media Type Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MediaType)}>
            <TabsList className={cn("grid w-full grid-cols-2", isMobile ? "mb-3 h-11" : "mb-4")}>
              <TabsTrigger value="images" className={cn(isMobile && "touch-target-44")}>
                <ImageIcon className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
                Images
              </TabsTrigger>
              <TabsTrigger value="videos" className={cn(isMobile && "touch-target-44")}>
                <Video className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
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
                <div className={cn("text-center", isMobile ? "py-8" : "py-12")}>
                  <Upload className={cn("text-gray-400 mx-auto mb-4", isMobile ? "w-10 h-10" : "w-12 h-12")} />
                  <p className={cn("text-gray-400", isMobile && "text-sm")}>
                    {files.length === 0
                      ? "No media files yet. Upload your first file!"
                      : "No files match your search criteria."}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className={cn(
                  "grid gap-4",
                  isMobile ? "grid-cols-2 gap-3" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                )}>
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative bg-gray-800 rounded-lg overflow-hidden aspect-square"
                    >
                      {/* Headshot Badge - Top Left Gold Star */}
                      {file.is_headshot && (
                        <div className="absolute top-2 left-2 z-10 p-1.5 bg-yellow-500/90 backdrop-blur-sm rounded-full shadow-lg">
                          <Star className="w-3 h-3 fill-black text-black" />
                        </div>
                      )}

                      {/* EPK Featured Badge - Top Right Blue Icon */}
                      {file.is_featured_in_epk && (
                        <div className="absolute top-2 right-2 z-10 p-1.5 bg-blue-500/90 backdrop-blur-sm rounded-full shadow-lg" title="Featured in EPK">
                          <FileText className="w-3 h-3 fill-white text-white" />
                        </div>
                      )}

                      {/* Profile Video Badge - Below EPK Badge */}
                      {file.is_profile_video && (
                        <div className="absolute top-10 right-2 z-10 p-1.5 bg-purple-500/90 backdrop-blur-sm rounded-full shadow-lg" title="Profile Video">
                          <UserCircle className="w-3 h-3 fill-white text-white" />
                        </div>
                      )}

                      {/* Thumbnail */}
                      {file.type === 'image' ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-700"><svg class="w-12 h-12 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-700">
                          {file.external_type === 'youtube' && file.external_id ? (
                            <img
                              src={`https://img.youtube.com/vi/${file.external_id}/maxresdefault.jpg`}
                              alt={file.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Try standard quality thumbnail if maxres fails
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('hqdefault.jpg')) {
                                  target.src = `https://img.youtube.com/vi/${file.external_id}/hqdefault.jpg`;
                                } else {
                                  // Fallback to generic video icon
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<svg class="w-12 h-12 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>';
                                  }
                                }
                              }}
                            />
                          ) : file.external_type === 'vimeo' && file.external_id ? (
                            <img
                              src={`https://vumbnail.com/${file.external_id}.jpg`}
                              alt={file.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to generic video icon
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<svg class="w-12 h-12 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>';
                                }
                              }}
                            />
                          ) : (
                            <Video className="w-12 h-12 text-gray-500" />
                          )}
                        </div>
                      )}

                      {/* Overlay Actions - Always visible on mobile via tap, hover on desktop */}
                      <div className={cn(
                        "absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center",
                        isMobile
                          ? "opacity-0 active:opacity-100 flex-wrap gap-1 p-2"
                          : "opacity-0 group-hover:opacity-100 gap-2"
                      )}>
                        {file.type === 'image' && (
                          <Button
                            size="icon"
                            variant={file.is_headshot ? "default" : "secondary"}
                            title={file.is_headshot ? "Unmark as Headshot" : "Mark as Headshot"}
                            onClick={() => handleToggleHeadshot(file.id, file.is_headshot || false)}
                            className={cn(isMobile && "h-9 w-9 touch-target-44")}
                          >
                            <Star className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", file.is_headshot && "fill-yellow-500 text-yellow-500")} />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant={file.is_featured_in_epk ? "default" : "secondary"}
                          title={file.is_featured_in_epk ? "Remove from EPK" : "Feature in EPK"}
                          onClick={() => handleToggleEPKFeatured(file.id, file.is_featured_in_epk || false)}
                          className={cn(isMobile && "h-9 w-9 touch-target-44")}
                        >
                          <FileText className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", file.is_featured_in_epk && "fill-blue-500 text-blue-500")} />
                        </Button>
                        {file.type === 'video' && (
                          <Button
                            size="icon"
                            variant={file.is_profile_video ? "default" : "secondary"}
                            title={file.is_profile_video ? "Remove Profile Video" : "Set as Profile Video"}
                            onClick={() => handleSetProfileVideo(file.id, file.is_profile_video || false)}
                            className={cn(isMobile && "h-9 w-9 touch-target-44")}
                          >
                            <UserCircle className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", file.is_profile_video && "fill-purple-500 text-purple-500")} />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="secondary"
                          title="Preview"
                          onClick={() => handlePreview(file)}
                          className={cn(isMobile && "h-9 w-9 touch-target-44")}
                        >
                          <Eye className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          title="Download"
                          onClick={() => handleDownload(file)}
                          className={cn(isMobile && "h-9 w-9 touch-target-44")}
                        >
                          <Download className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          title="Edit Name"
                          onClick={() => setEditingMedia(file)}
                          className={cn(isMobile && "h-9 w-9 touch-target-44")}
                        >
                          <Edit2 className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          title="Delete"
                          onClick={() => handleDelete(file)}
                          className={cn(isMobile && "h-9 w-9 touch-target-44")}
                        >
                          <Trash2 className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
                        </Button>
                      </div>

                      {/* File Info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white truncate">{file.name}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                          {file.tags && file.tags.length > 0 && (
                            <MediaTagDisplay tags={file.tags} maxDisplay={2} className="ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={cn("space-y-2", isMobile && "space-y-3")}>
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={cn(
                        "bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors",
                        isMobile ? "p-3 space-y-3" : "flex items-center justify-between p-3"
                      )}
                    >
                      <div className={cn("flex items-center gap-3", isMobile && "w-full")}>
                        {file.type === 'image' ? (
                          <ImageIcon className={cn(isMobile ? "w-6 h-6" : "w-5 h-5", "text-gray-400 flex-shrink-0")} />
                        ) : (
                          <div className="relative flex-shrink-0">
                            <Video className={cn(isMobile ? "w-6 h-6" : "w-5 h-5", "text-gray-400")} />
                            {file.external_url && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-gray-800" title="External video" />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={cn("font-medium text-white truncate", isMobile ? "text-sm" : "text-sm")}>{file.name}</p>
                            {file.is_headshot && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-300 rounded">
                                <Star className="w-3 h-3 fill-yellow-300" />
                                {!isMobile && "Headshot"}
                              </span>
                            )}
                          </div>
                          <div className={cn(
                            "flex text-xs text-gray-400 mt-1",
                            isMobile ? "flex-col gap-1" : "items-center gap-2"
                          )}>
                            <span>{formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString()}</span>
                            {!isMobile && <span>•</span>}
                            <Select
                              value={file.folder_id || "none"}
                              onValueChange={(value) => handleReassignToFolder(file.id, value === "none" ? null : value)}
                            >
                              <SelectTrigger className={cn(
                                "text-xs",
                                isMobile ? "h-8 w-full touch-target-44" : "h-6 w-32"
                              )}>
                                <SelectValue>
                                  <span className="flex items-center gap-1">
                                    <Folder className="w-3 h-3" />
                                    {file.folder || "No folder"}
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No folder</SelectItem>
                                {folders.map((folder) => (
                                  <SelectItem key={folder.id} value={folder.id}>
                                    {folder.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "flex items-center",
                        isMobile ? "gap-2 justify-end flex-wrap pt-2 border-t border-gray-700" : "gap-1"
                      )}>
                        {file.type === 'image' && (
                          <Button
                            size="icon"
                            variant={file.is_headshot ? "default" : "ghost"}
                            title={file.is_headshot ? "Unmark as Headshot" : "Mark as Headshot"}
                            onClick={() => handleToggleHeadshot(file.id, file.is_headshot || false)}
                            className={cn(isMobile && "h-10 w-10 touch-target-44")}
                          >
                            <Star className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", file.is_headshot && "fill-yellow-500 text-yellow-500")} />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant={file.is_featured_in_epk ? "default" : "ghost"}
                          title={file.is_featured_in_epk ? "Remove from EPK" : "Feature in EPK"}
                          onClick={() => handleToggleEPKFeatured(file.id, file.is_featured_in_epk || false)}
                          className={cn(isMobile && "h-10 w-10 touch-target-44")}
                        >
                          <FileText className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", file.is_featured_in_epk && "fill-blue-500 text-blue-500")} />
                        </Button>
                        {file.type === 'video' && (
                          <Button
                            size="icon"
                            variant={file.is_profile_video ? "default" : "ghost"}
                            title={file.is_profile_video ? "Remove Profile Video" : "Set as Profile Video"}
                            onClick={() => handleSetProfileVideo(file.id, file.is_profile_video || false)}
                            className={cn(isMobile && "h-10 w-10 touch-target-44")}
                          >
                            <UserCircle className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", file.is_profile_video && "fill-purple-500 text-purple-500")} />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Preview"
                          onClick={() => handlePreview(file)}
                          className={cn(isMobile && "h-10 w-10 touch-target-44")}
                        >
                          <Eye className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Download"
                          onClick={() => handleDownload(file)}
                          className={cn(isMobile && "h-10 w-10 touch-target-44")}
                        >
                          <Download className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edit Name"
                          onClick={() => setEditingMedia(file)}
                          className={cn(isMobile && "h-10 w-10 touch-target-44")}
                        >
                          <Edit2 className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          title="Delete"
                          onClick={() => handleDelete(file)}
                          className={cn(isMobile && "h-10 w-10 touch-target-44")}
                        >
                          <Trash2 className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
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

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent mobileVariant="bottomSheet">
          <DialogHeader>
            <DialogTitle className={cn(isMobile && "text-lg")}>Create New Folder</DialogTitle>
            <DialogDescription className={cn(isMobile && "text-sm")}>
              Create a new folder to organize your media files.
            </DialogDescription>
          </DialogHeader>
          <div className={cn("space-y-4", isMobile ? "py-3" : "py-4")}>
            <div>
              <Label htmlFor="folder-name" className={cn(isMobile && "text-sm")}>Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name..."
                className={cn(isMobile && "h-11 touch-target-44 mt-1")}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreatingFolder) {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className={cn(isMobile && "flex-col gap-2")}>
            {isMobile ? (
              <>
                <Button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || isCreatingFolder}
                  className="w-full touch-target-44"
                >
                  {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateFolderDialog(false);
                    setNewFolderName('');
                  }}
                  disabled={isCreatingFolder}
                  className="w-full touch-target-44"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="professional-button"
                  onClick={() => {
                    setShowCreateFolderDialog(false);
                    setNewFolderName('');
                  }}
                  disabled={isCreatingFolder}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || isCreatingFolder}
                >
                  {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Video URL Dialog */}
      <Dialog open={showAddVideoUrl} onOpenChange={setShowAddVideoUrl}>
        <DialogContent mobileVariant="bottomSheet">
          <DialogHeader>
            <DialogTitle className={cn(isMobile && "text-lg")}>Add Video from URL</DialogTitle>
            <DialogDescription className={cn(isMobile && "text-sm")}>
              {isMobile
                ? "Add a YouTube or Vimeo video"
                : "Add a YouTube, Vimeo, Google Drive, or Dropbox video to your media library."}
            </DialogDescription>
          </DialogHeader>
          <div className={cn("space-y-4", isMobile ? "py-3" : "py-4")}>
            <div>
              <Label htmlFor="video-url" className={cn(isMobile && "text-sm")}>Video URL</Label>
              <Input
                id="video-url"
                type="url"
                inputMode="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className={cn(isMobile && "h-11 touch-target-44 mt-1")}
              />
              <p className="text-xs text-gray-400 mt-1">
                {isMobile ? "YouTube, Vimeo supported" : "Supported: YouTube, Vimeo, Google Drive, Dropbox"}
              </p>
            </div>
            <div>
              <Label htmlFor="video-title" className={cn(isMobile && "text-sm")}>Title (Optional)</Label>
              <Input
                id="video-title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter video title..."
                className={cn(isMobile && "h-11 touch-target-44 mt-1")}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isAddingVideo && videoUrl.trim()) {
                    handleAddExternalVideo();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className={cn(isMobile && "flex-col gap-2")}>
            {isMobile ? (
              <>
                <Button
                  onClick={handleAddExternalVideo}
                  disabled={!videoUrl.trim() || isAddingVideo}
                  className="w-full touch-target-44"
                >
                  {isAddingVideo ? 'Adding...' : 'Add Video'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddVideoUrl(false);
                    setVideoUrl('');
                    setVideoTitle('');
                  }}
                  disabled={isAddingVideo}
                  className="w-full touch-target-44"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAddVideoUrl(false);
                    setVideoUrl('');
                    setVideoTitle('');
                  }}
                  disabled={isAddingVideo}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddExternalVideo}
                  disabled={!videoUrl.trim() || isAddingVideo}
                >
                  {isAddingVideo ? 'Adding...' : 'Add Video'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Media Name Dialog */}
      {editingMedia && (
        <EditMediaTitleDialog
          isOpen={!!editingMedia}
          onClose={() => setEditingMedia(null)}
          onSave={(newName) => handleUpdateName(editingMedia.id, newName)}
          currentTitle={editingMedia.name}
          mediaType={editingMedia.type === 'image' ? 'photo' : 'video'}
        />
      )}

      {/* Media Preview Dialog */}
      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent
          className={cn(!isMobile && "max-w-4xl")}
          mobileVariant="fullscreen"
        >
          <DialogHeader>
            <DialogTitle className={cn("truncate", isMobile && "text-base pr-8")}>{previewMedia?.name}</DialogTitle>
            <DialogDescription className={cn(isMobile && "text-sm")}>
              {previewMedia?.type === 'image' ? 'Image Preview' : 'Video Preview'}
            </DialogDescription>
          </DialogHeader>
          <div className={cn(isMobile ? "mt-2 flex-1 flex items-center justify-center" : "mt-4")}>
            {previewMedia?.type === 'image' ? (
              // Image preview - full size
              <img
                src={previewMedia.url}
                alt={previewMedia.name}
                className={cn(
                  "w-full h-auto object-contain rounded-lg",
                  isMobile ? "max-h-[60vh]" : "max-h-[70vh]"
                )}
              />
            ) : previewMedia?.external_type === 'youtube' && previewMedia?.external_id ? (
              // YouTube embed
              <div className={cn("relative w-full", isMobile && "flex-1")} style={{ paddingBottom: isMobile ? '75%' : '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={`https://www.youtube.com/embed/${previewMedia.external_id}`}
                  title={previewMedia.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : previewMedia?.external_type === 'vimeo' && previewMedia?.external_id ? (
              // Vimeo embed
              <div className={cn("relative w-full", isMobile && "flex-1")} style={{ paddingBottom: isMobile ? '75%' : '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={`https://player.vimeo.com/video/${previewMedia.external_id}`}
                  title={previewMedia.name}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : previewMedia?.type === 'video' && previewMedia?.url ? (
              // Uploaded video player
              <video
                controls
                className={cn(
                  "w-full h-auto rounded-lg",
                  isMobile ? "max-h-[60vh]" : "max-h-[70vh]"
                )}
                src={previewMedia.url}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <p className="text-center text-muted-foreground">Preview not available</p>
            )}
          </div>
          {/* Tag Editor in Preview */}
          {previewMedia && (
            <div className={cn("border-t pt-4", isMobile ? "mt-2" : "mt-4")}>
              <Label className="text-sm font-medium mb-2 block">Tags</Label>
              <MediaTagInput
                value={previewMedia.tags || []}
                onChange={(newTags) => {
                  handleTagsChange(previewMedia.id, newTags);
                  setPreviewMedia(prev => prev ? { ...prev, tags: newTags } : null);
                }}
                placeholder="Add tags..."
                className="max-w-full"
              />
            </div>
          )}

          <DialogFooter className={cn(isMobile ? "mt-2 flex-col gap-2" : "mt-4")}>
            {isMobile ? (
              <>
                {previewMedia && (
                  <Button
                    onClick={() => handleDownload(previewMedia)}
                    className="w-full touch-target-44"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => setPreviewMedia(null)}
                  className="w-full touch-target-44"
                >
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setPreviewMedia(null)}>
                  Close
                </Button>
                {previewMedia && (
                  <Button onClick={() => handleDownload(previewMedia)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
