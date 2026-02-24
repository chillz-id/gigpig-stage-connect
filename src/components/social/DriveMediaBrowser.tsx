/**
 * DriveMediaBrowser Component
 *
 * Browse, sync, and manage Google Drive media assets for social posting.
 * Shows assets grouped by brand with status tracking and reuse prevention.
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  HardDrive,
  RefreshCw,
  Loader2,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Archive,
  FolderOpen,
} from 'lucide-react';
import { useDriveAssets, useSyncDriveMedia } from '@/hooks/social/useDriveMedia';
import { useToast } from '@/hooks/use-toast';
import { DRIVE_BRANDS } from '@/types/social';
import type { DriveBrand, DriveMediaAsset } from '@/types/social';

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function getStatusIcon(status: DriveMediaAsset['status']) {
  switch (status) {
    case 'available':
      return <FolderOpen className="h-3.5 w-3.5 text-green-500" />;
    case 'scheduled':
      return <Clock className="h-3.5 w-3.5 text-blue-500" />;
    case 'posted':
      return <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />;
    case 'archived':
      return <Archive className="h-3.5 w-3.5 text-gray-400" />;
  }
}

function getStatusLabel(status: DriveMediaAsset['status']) {
  switch (status) {
    case 'available':
      return 'Available';
    case 'scheduled':
      return 'Scheduled';
    case 'posted':
      return 'Posted';
    case 'archived':
      return 'Archived';
  }
}

type StatusFilter = 'all' | DriveMediaAsset['status'];

export function DriveMediaBrowser() {
  const { toast } = useToast();
  const [selectedBrand, setSelectedBrand] = useState<DriveBrand>(DRIVE_BRANDS[0]!);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const {
    data: assets,
    isLoading,
  } = useDriveAssets(
    selectedBrand,
    statusFilter === 'all' ? undefined : statusFilter,
  );

  const syncMutation = useSyncDriveMedia();

  const handleSync = () => {
    syncMutation.mutate(selectedBrand, {
      onSuccess: (result) => {
        toast({
          title: 'Drive sync complete',
          description: `Found ${result.totalCreated} new files across ${result.foldersScanned} folders.`,
        });
      },
      onError: (err) => {
        toast({
          title: 'Sync failed',
          description: err instanceof Error ? err.message : 'Check Google Drive configuration.',
          variant: 'destructive',
        });
      },
    });
  };

  const availableCount = assets?.filter((a) => a.status === 'available').length ?? 0;
  const scheduledCount = assets?.filter((a) => a.status === 'scheduled').length ?? 0;
  const postedCount = assets?.filter((a) => a.status === 'posted').length ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Media Library
              </CardTitle>
              <CardDescription>
                Google Drive media for social content
              </CardDescription>
            </div>
            <Button
              onClick={handleSync}
              disabled={syncMutation.isPending}
              size="sm"
            >
              {syncMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync from Drive
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={selectedBrand}
              onValueChange={(v) => setSelectedBrand(v as DriveBrand)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DRIVE_BRANDS.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Stats */}
            <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
              <Badge variant="secondary" className="gap-1">
                <FolderOpen className="h-3 w-3" /> {availableCount} available
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" /> {scheduledCount} scheduled
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> {postedCount} posted
              </Badge>
            </div>
          </div>

          {/* Asset Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !assets || assets.length === 0 ? (
            <Alert>
              <HardDrive className="h-4 w-4" />
              <AlertDescription>
                No media assets found for {selectedBrand}.
                Click "Sync from Drive" to scan your Google Drive folders.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden">
                  <div className="relative">
                    {/* Thumbnail */}
                    {asset.thumbnail_url ? (
                      <img
                        src={asset.thumbnail_url}
                        alt={asset.file_name}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-muted flex items-center justify-center">
                        {asset.file_type === 'video' ? (
                          <Film className="h-8 w-8 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                    )}

                    {/* Status overlay */}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="secondary"
                        className="gap-1 bg-background/80 backdrop-blur-sm text-xs"
                      >
                        {getStatusIcon(asset.status)}
                        {getStatusLabel(asset.status)}
                      </Badge>
                    </div>

                    {/* Video duration overlay */}
                    {asset.file_type === 'video' && asset.duration_seconds && (
                      <div className="absolute bottom-2 right-2">
                        <Badge
                          variant="secondary"
                          className="bg-black/70 text-white text-xs"
                        >
                          {formatDuration(asset.duration_seconds)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-3 space-y-1.5">
                    <p className="text-sm font-medium truncate" title={asset.file_name}>
                      {asset.file_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>{asset.file_type === 'video' ? 'Video' : 'Image'}</span>
                      <span>{formatFileSize(asset.file_size)}</span>
                      {asset.width && asset.height && (
                        <span>{asset.width}x{asset.height}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate" title={asset.folder_path}>
                        {asset.folder_path.split('/').slice(-1)[0]}
                      </span>
                      {asset.used_count > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-4">
                          Used {asset.used_count}x
                        </Badge>
                      )}
                    </div>
                    {asset.posted_platforms && asset.posted_platforms.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {asset.posted_platforms.map((p) => (
                          <Badge key={p} variant="secondary" className="text-[10px] h-4 capitalize">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
