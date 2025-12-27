/**
 * BulkEditMetadataDialog Component
 *
 * Dialog for editing metadata across multiple photos at once.
 * Supports adding tags, setting photographer credit, and event date.
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, X, Tag, Camera, Calendar, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { directoryService } from '@/services/directory';

interface BulkEditMetadataDialogProps {
  mediaIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkEditMetadataDialog({
  mediaIds,
  open,
  onOpenChange,
  onSuccess,
}: BulkEditMetadataDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [newTag, setNewTag] = useState('');
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [selectedPhotographerId, setSelectedPhotographerId] = useState<string>('');
  const [sessionDate, setSessionDate] = useState('');

  // Options
  const [photographers, setPhotographers] = useState<Array<{ id: string; stage_name: string }>>([]);

  // Load photographers on mount
  useEffect(() => {
    const loadPhotographers = async () => {
      const photographerProfiles = await directoryService.searchProfiles('', { profileType: 'photographer' });
      setPhotographers(Array.isArray(photographerProfiles) ? photographerProfiles : []);
    };
    loadPhotographers();
  }, []);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setNewTag('');
      setTagsToAdd([]);
      setSelectedPhotographerId('');
      setSessionDate('');
    }
  }, [open]);

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tagsToAdd.includes(tag)) {
      setTagsToAdd([...tagsToAdd, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTagsToAdd(tagsToAdd.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSave = async () => {
    if (mediaIds.length === 0) return;

    // Check if there's anything to update
    const hasChanges = tagsToAdd.length > 0 || selectedPhotographerId || sessionDate;
    if (!hasChanges) {
      toast({
        title: 'No Changes',
        description: 'Please add tags, select a photographer, or set a date.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const mediaId of mediaIds) {
        try {
          // Update tags if any were added
          if (tagsToAdd.length > 0) {
            // Get existing tags first
            const { data: existingFile } = await supabase
              .from('media_files')
              .select('tags')
              .eq('id', mediaId)
              .single();

            const existingTags = existingFile?.tags || [];
            const mergedTags = [...new Set([...existingTags, ...tagsToAdd])];

            await supabase
              .from('media_files')
              .update({ tags: mergedTags })
              .eq('id', mediaId);
          }

          // Update photographer if selected
          if (selectedPhotographerId) {
            // Remove existing photographer link
            await supabase
              .from('directory_media_profiles')
              .delete()
              .eq('media_id', mediaId)
              .eq('role', 'photographer');

            // Add new photographer link
            await directoryService.addMediaProfile({
              media_id: mediaId,
              profile_id: selectedPhotographerId,
              role: 'photographer',
              is_primary_subject: false,
              approval_status: 'approved',
            });
          }

          // Update event/date if set
          if (sessionDate) {
            // Remove existing event link
            await supabase
              .from('directory_media_events')
              .delete()
              .eq('media_id', mediaId);

            // Add new event link with date
            await directoryService.addMediaEvent(mediaId, {
              sessionDate: sessionDate,
            });
          }

          successCount++;
        } catch (error) {
          console.error(`Failed to update media ${mediaId}:`, error);
          failCount++;
        }
      }

      if (failCount === 0) {
        toast({
          title: 'Metadata Updated',
          description: `Successfully updated ${successCount} photo${successCount > 1 ? 's' : ''}.`,
        });
      } else {
        toast({
          title: 'Partial Update',
          description: `Updated ${successCount} photos. ${failCount} failed.`,
          variant: 'destructive',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Bulk edit failed:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update photo metadata',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Metadata</DialogTitle>
          <DialogDescription>
            Update metadata for {mediaIds.length} selected photo{mediaIds.length > 1 ? 's' : ''}.
            Changes will be applied to all selected items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info banner */}
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-sm">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p className="text-muted-foreground">
              Only fill in the fields you want to update. Empty fields will be left unchanged.
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Add Tags
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Type a tag and press Enter"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button type="button" variant="secondary" onClick={addTag} disabled={!newTag.trim()}>
                Add
              </Button>
            </div>
            {tagsToAdd.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tagsToAdd.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Tags will be added to existing tags (not replaced).
            </p>
          </div>

          {/* Photographer */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photographer Credit
            </Label>
            <Select
              value={selectedPhotographerId || '_none'}
              onValueChange={(val) => setSelectedPhotographerId(val === '_none' ? '' : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a photographer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Don't change</SelectItem>
                {photographers.map((photographer) => (
                  <SelectItem key={photographer.id} value={photographer.id}>
                    {photographer.stage_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Will replace any existing photographer credit.
            </p>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Taken
            </Label>
            <Input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Will replace any existing date.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>Update {mediaIds.length} Photo{mediaIds.length > 1 ? 's' : ''}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
