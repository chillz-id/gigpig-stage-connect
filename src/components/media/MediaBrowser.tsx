import { useState, useEffect, useCallback, useRef } from 'react';
import { useMediaStorage, StorageFile, StorageFolder } from '@/hooks/useMediaStorage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ImageEditor, SavedImageData } from '@/components/ui/ImageEditor';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Folder,
  File,
  Image,
  MoreVertical,
  Upload,
  ChevronRight,
  Home,
  Pencil,
  Trash2,
  User,
  ImageIcon,
  Loader2,
  RefreshCw,
  ArrowLeft,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Download,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Helper to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Helper to convert URL to base64 (bypasses CORS issues)
async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    // If fetch fails, return original URL and let editor handle it
    return url;
  }
}

interface MediaBrowserProps {
  initialPath?: string;
  onFileSelect?: (file: StorageFile) => void;
  mode?: 'browser' | 'picker';
}

export function MediaBrowser({
  initialPath = '',
  onFileSelect,
  mode = 'browser'
}: MediaBrowserProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    loading,
    error,
    listFiles,
    uploadFile,
    deleteFile,
    renameFile,
    updateProfilePic,
    updateBanner,
    saveEditedImage
  } = useMediaStorage();

  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [folders, setFolders] = useState<StorageFolder[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal states
  const [editingFile, setEditingFile] = useState<StorageFile | null>(null);
  const [editingImageBase64, setEditingImageBase64] = useState<string | null>(null);
  const [isLoadingEditor, setIsLoadingEditor] = useState(false);
  const [renamingFile, setRenamingFile] = useState<StorageFile | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [deletingFile, setDeletingFile] = useState<StorageFile | null>(null);
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);

  // Selection state
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const loadFiles = useCallback(async () => {
    const result = await listFiles(currentPath);
    setFiles(result.files);
    setFolders(result.folders);
  }, [currentPath, listFiles]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleGoBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles?.length) return;

    for (const file of uploadedFiles) {
      const result = await uploadFile(currentPath, file);
      if (result) {
        toast({ title: 'File uploaded', description: file.name });
      } else {
        toast({ title: 'Upload failed', description: file.name, variant: 'destructive' });
      }
    }

    loadFiles();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRename = async () => {
    if (!renamingFile || !newFileName.trim()) return;

    const result = await renameFile(renamingFile, newFileName.trim());
    if (result) {
      toast({ title: 'File renamed' });
      loadFiles();
    } else {
      toast({ title: 'Rename failed', variant: 'destructive' });
    }
    setRenamingFile(null);
    setNewFileName('');
  };

  const handleDelete = async () => {
    if (!deletingFile) return;

    const success = await deleteFile(deletingFile);
    if (success) {
      toast({ title: 'File deleted' });
      loadFiles();
    } else {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
    setDeletingFile(null);
  };

  // Open editor with pre-loaded base64 (avoids CORS issues)
  const openEditor = async (file: StorageFile) => {
    setIsLoadingEditor(true);
    setEditingFile(file);
    try {
      const base64 = await urlToBase64(file.publicUrl);
      setEditingImageBase64(base64);
    } catch (err) {
      console.error('Failed to load image for editing:', err);
      toast({ title: 'Failed to load image', variant: 'destructive' });
      setEditingFile(null);
    } finally {
      setIsLoadingEditor(false);
    }
  };

  const closeEditor = () => {
    setEditingFile(null);
    setEditingImageBase64(null);
  };

  const handleSetProfilePic = async (file: StorageFile) => {
    const success = await updateProfilePic(file);
    if (success) {
      toast({ title: 'Profile picture updated!' });
    } else {
      toast({ title: 'Failed to update profile picture', variant: 'destructive' });
    }
  };

  const handleSetBanner = async (file: StorageFile) => {
    const success = await updateBanner(file);
    if (success) {
      toast({ title: 'Banner updated!' });
    } else {
      toast({ title: 'Failed to update banner', variant: 'destructive' });
    }
  };

  const handleSaveEdit = async (imageData: SavedImageData) => {
    if (!editingFile || !imageData.imageBase64) return;

    try {
      // Convert base64 data URL to blob
      const response = await fetch(imageData.imageBase64);
      const blob = await response.blob();

      const savedFile = await saveEditedImage(editingFile, blob);
      if (savedFile) {
        toast({
          title: 'Image saved!',
          description: `Saved as "${savedFile.name}"`
        });
        loadFiles();
      } else {
        toast({ title: 'Failed to save image', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Failed to process edited image:', err);
      toast({ title: 'Failed to process edited image', variant: 'destructive' });
    }

    closeEditor();
  };

  // Build breadcrumb parts
  const pathParts = currentPath.split('/').filter(Boolean);
  const breadcrumbs = [
    { name: 'Home', path: '' },
    ...pathParts.map((part, idx) => ({
      name: part,
      path: pathParts.slice(0, idx + 1).join('/')
    }))
  ];

  // Can upload only in actual storage paths (not virtual root)
  const canUpload = currentPath.startsWith('my-files/profile') || currentPath.startsWith('my-files/media');

  // Selection handlers
  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    setSelectedFiles(new Set(files.map(f => f.id)));
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    const count = selectedFiles.size;
    if (!window.confirm(`Delete ${count} file(s)? This cannot be undone.`)) return;

    let deleted = 0;
    for (const fileId of selectedFiles) {
      const file = files.find(f => f.id === fileId);
      if (file) {
        const success = await deleteFile(file);
        if (success) deleted++;
      }
    }

    toast({
      title: 'Files deleted',
      description: `Deleted ${deleted} of ${count} files.`
    });
    clearSelection();
    loadFiles();
  };

  const handleBulkDownload = async () => {
    const selectedFilesList = files.filter(f => selectedFiles.has(f.id));
    for (const file of selectedFilesList) {
      const link = document.createElement('a');
      link.href = file.publicUrl;
      link.download = file.name;
      link.click();
      // Stagger downloads
      await new Promise(r => setTimeout(r, 300));
    }
    toast({ title: 'Downloads started', description: `Downloading ${selectedFilesList.length} files.` });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with breadcrumbs and actions */}
      <div className="flex items-center justify-between border-b p-3 gap-4">
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {currentPath && (
            <Button variant="ghost" size="icon" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.path} className="flex items-center">
              {idx > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-sm',
                  idx === breadcrumbs.length - 1 && 'font-semibold'
                )}
                onClick={() => handleNavigate(crumb.path)}
              >
                {idx === 0 ? <Home className="h-4 w-4" /> : crumb.name}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" onClick={loadFiles} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>

          {/* Select button - show when there are files, positioned before Upload */}
          {files.length > 0 && (
            <Button
              variant={isSelectionMode ? 'secondary' : 'secondary'}
              size="sm"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedFiles(new Set());
              }}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {isSelectionMode ? 'Cancel' : 'Select'}
            </Button>
          )}

          {canUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleUpload}
                accept="image/*"
              />
              <Button
                variant="default"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* File grid */}
      <div className="flex-1 overflow-auto p-4">
        {loading && files.length === 0 && folders.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 && folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Folder className="h-16 w-16 mb-4 opacity-50" />
            <p>No files or folders</p>
            {canUpload && (
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload your first file
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {/* Folders */}
            {folders.map((folder) => (
              <Card
                key={folder.path}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleNavigate(folder.path)}
              >
                <CardContent className="p-4 flex flex-col items-center">
                  <Folder className="h-12 w-12 text-yellow-500 mb-2" />
                  <span className="text-sm font-medium text-center truncate w-full">
                    {folder.name}
                  </span>
                </CardContent>
              </Card>
            ))}

            {/* Files */}
            {files.map((file) => (
              <Card key={file.id} className="group relative">
                <CardContent className="p-2">
                  {/* Selection checkbox */}
                  {isSelectionMode && (
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={() => toggleFileSelection(file.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-background border-2"
                      />
                    </div>
                  )}

                  {/* Thumbnail or icon */}
                  <div
                    className={cn(
                      "aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center cursor-pointer",
                      isSelectionMode && selectedFiles.has(file.id) && "ring-2 ring-primary"
                    )}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleFileSelection(file.id);
                      } else if (mode === 'picker' && onFileSelect) {
                        onFileSelect(file);
                      } else if (file.isImage) {
                        setPreviewFile(file);
                      }
                    }}
                  >
                    {file.isImage ? (
                      <img
                        src={file.publicUrl}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <File className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* File name */}
                  <p className="mt-2 text-sm truncate" title={file.name}>
                    {file.name}
                  </p>

                  {/* Action menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {file.isImage && (
                        <>
                          <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                            <Image className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditor(file)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Image
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleSetProfilePic(file)}>
                            <User className="h-4 w-4 mr-2" />
                            Set as Profile Pic
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetBanner(file)}>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Set as Banner
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => {
                        const link = document.createElement('a');
                        link.href = file.publicUrl;
                        link.download = file.name;
                        link.click();
                      }}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setRenamingFile(file);
                        setNewFileName(file.name);
                      }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeletingFile(file)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-1">
            {/* Header row */}
            <div className={cn(
              "grid gap-4 px-3 py-2 text-xs font-medium text-muted-foreground border-b",
              isSelectionMode ? "grid-cols-[24px_auto_1fr_100px_120px_40px]" : "grid-cols-[auto_1fr_100px_120px_40px]"
            )}>
              {isSelectionMode && (
                <Checkbox
                  checked={selectedFiles.size === files.length && files.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) selectAllFiles();
                    else setSelectedFiles(new Set());
                  }}
                  className="mt-0.5"
                />
              )}
              <div className="w-10" />
              <div>Name</div>
              <div>Size</div>
              <div>Uploaded</div>
              <div />
            </div>

            {/* Folders */}
            {folders.map((folder) => (
              <div
                key={folder.path}
                className={cn(
                  "grid gap-4 items-center px-3 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
                  isSelectionMode ? "grid-cols-[24px_auto_1fr_100px_120px_40px]" : "grid-cols-[auto_1fr_100px_120px_40px]"
                )}
                onClick={() => handleNavigate(folder.path)}
              >
                {isSelectionMode && <div className="w-6" />}
                <div className="w-10 h-10 flex items-center justify-center">
                  <Folder className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="font-medium truncate">{folder.name}</div>
                <div className="text-sm text-muted-foreground">—</div>
                <div className="text-sm text-muted-foreground">—</div>
                <div />
              </div>
            ))}

            {/* Files */}
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "group grid gap-4 items-center px-3 py-2 rounded-md hover:bg-accent transition-colors",
                  isSelectionMode ? "grid-cols-[24px_auto_1fr_100px_120px_40px]" : "grid-cols-[auto_1fr_100px_120px_40px]",
                  selectedFiles.has(file.id) && "bg-accent/50"
                )}
              >
                {/* Selection checkbox */}
                {isSelectionMode && (
                  <Checkbox
                    checked={selectedFiles.has(file.id)}
                    onCheckedChange={() => toggleFileSelection(file.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}

                {/* Thumbnail */}
                <div
                  className="w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleFileSelection(file.id);
                    } else if (mode === 'picker' && onFileSelect) {
                      onFileSelect(file);
                    } else if (file.isImage) {
                      setPreviewFile(file);
                    }
                  }}
                >
                  {file.isImage ? (
                    <img
                      src={file.publicUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <File className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* File name */}
                <div
                  className="font-medium truncate cursor-pointer"
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleFileSelection(file.id);
                    } else if (mode === 'picker' && onFileSelect) {
                      onFileSelect(file);
                    } else if (file.isImage) {
                      setPreviewFile(file);
                    }
                  }}
                  title={file.name}
                >
                  {file.name}
                </div>

                {/* Size */}
                <div className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </div>

                {/* Date */}
                <div className="text-sm text-muted-foreground">
                  {formatDate(file.createdAt)}
                </div>

                {/* Action menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {file.isImage && (
                      <>
                        <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                          <Image className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditor(file)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Image
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleSetProfilePic(file)}>
                          <User className="h-4 w-4 mr-2" />
                          Set as Profile Pic
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetBanner(file)}>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Set as Banner
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => {
                      const link = document.createElement('a');
                      link.href = file.publicUrl;
                      link.download = file.name;
                      link.click();
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setRenamingFile(file);
                      setNewFileName(file.name);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeletingFile(file)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedFiles.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3 z-50">
          <span className="text-sm font-medium">
            {selectedFiles.size} selected
          </span>
          <Separator orientation="vertical" className="h-6" />
          <Button size="sm" variant="secondary" onClick={selectAllFiles}>
            <CheckSquare className="h-4 w-4 mr-2" />
            Select All
          </Button>
          <Button size="sm" variant="secondary" onClick={handleBulkDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button size="sm" variant="ghost" onClick={clearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="flex justify-center">
              <img
                src={previewFile.publicUrl}
                alt={previewFile.name}
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
          <DialogFooter className="flex-row justify-between sm:justify-between">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => previewFile && openEditor(previewFile)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => previewFile && handleSetProfilePic(previewFile)}>
                <User className="h-4 w-4 mr-2" />
                Set as Profile Pic
              </Button>
              <Button variant="secondary" onClick={() => previewFile && handleSetBanner(previewFile)}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Set as Banner
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renamingFile} onOpenChange={(open) => !open && setRenamingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>Enter a new name for the file.</DialogDescription>
          </DialogHeader>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="New file name"
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRenamingFile(null)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!newFileName.trim()}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingFile} onOpenChange={(open) => !open && setDeletingFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingFile?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Editor Modal */}
      {editingFile && (
        <Dialog open={true} onOpenChange={closeEditor}>
          <DialogContent className="max-w-6xl h-[90vh] p-0">
            {isLoadingEditor || !editingImageBase64 ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading image editor...</span>
              </div>
            ) : (
              <ImageEditor
                source={editingImageBase64}
                onSave={handleSaveEdit}
                onClose={closeEditor}
                height="calc(90vh - 2rem)"
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
