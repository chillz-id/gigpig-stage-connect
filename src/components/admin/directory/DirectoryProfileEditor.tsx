/**
 * DirectoryProfileEditor Component
 *
 * Edit directory profile details including headshot upload.
 */

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Upload, User } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { directoryService } from '@/services/directory';
import type { DirectoryProfile } from '@/types/directory';

const profileSchema = z.object({
  stage_name: z.string().min(1, 'Stage name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  booking_email: z.string().email('Invalid email').optional().or(z.literal('')),
  short_bio: z.string().optional(),
  origin_city: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagram_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  youtube_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  tiktok_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  facebook_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface DirectoryProfileEditorProps {
  profile: DirectoryProfile;
  onClose: () => void;
  onSave: () => void;
}

export function DirectoryProfileEditor({
  profile,
  onClose,
  onSave,
}: DirectoryProfileEditorProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState<string[]>(profile.tags);
  const [tagInput, setTagInput] = useState('');
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(
    profile.primary_headshot_url
  );
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      stage_name: profile.stage_name,
      email: profile.email ?? '',
      booking_email: profile.booking_email ?? '',
      short_bio: profile.short_bio ?? '',
      origin_city: profile.origin_city ?? '',
      website: profile.website ?? '',
      instagram_url: profile.instagram_url ?? '',
      youtube_url: profile.youtube_url ?? '',
      tiktok_url: profile.tiktok_url ?? '',
      twitter_url: profile.twitter_url ?? '',
      facebook_url: profile.facebook_url ?? '',
    },
  });

  const getDialogStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-purple-900/95 border-white/20 text-white';
    }
    return 'bg-gray-900 border-gray-700 text-gray-100';
  };

  const getInputStyles = () => {
    return 'bg-white/10 border-white/20 text-white placeholder:text-white/50';
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleHeadshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 10MB',
        variant: 'destructive',
      });
      return;
    }

    setHeadshotFile(file);
    setHeadshotPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSaving(true);
    try {
      // Upload headshot first if a new one was selected
      if (headshotFile) {
        setIsUploading(true);
        try {
          await directoryService.uploadPhoto(profile.id, headshotFile, {
            isHeadshot: true,
            isPrimary: true,
          });
        } catch (uploadError) {
          console.error('Failed to upload headshot:', uploadError);
          toast({
            title: 'Upload Error',
            description: 'Failed to upload headshot, but profile will still be saved',
            variant: 'destructive',
          });
        } finally {
          setIsUploading(false);
        }
      }

      await directoryService.updateProfile(profile.id, {
        stage_name: values.stage_name,
        email: values.email || null,
        booking_email: values.booking_email || null,
        short_bio: values.short_bio || null,
        origin_city: values.origin_city || null,
        website: values.website || null,
        instagram_url: values.instagram_url || null,
        youtube_url: values.youtube_url || null,
        tiktok_url: values.tiktok_url || null,
        twitter_url: values.twitter_url || null,
        facebook_url: values.facebook_url || null,
        tags,
      });

      toast({
        title: 'Profile Updated',
        description: `${values.stage_name}'s profile has been saved`,
      });

      onSave();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className={cn("max-w-lg max-h-[90vh] overflow-y-auto", getDialogStyles())}>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Headshot Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Headshot</label>
              <div className="flex items-center gap-4">
                <div
                  className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 bg-white/5 flex-shrink-0 cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {headshotPreview ? (
                    <img
                      src={headshotPreview}
                      alt={profile.stage_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-white border-white/20"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {headshotPreview ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  <p className="text-xs text-white/40 mt-1">JPG, PNG or WebP. Max 10MB.</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleHeadshotSelect}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="stage_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Stage Name *</FormLabel>
                  <FormControl>
                    <Input {...field} className={getInputStyles()} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" className={getInputStyles()} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="booking_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Booking Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" className={getInputStyles()} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="origin_city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Location</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Sydney" className={getInputStyles()} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="short_bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      className={cn(getInputStyles(), "resize-none")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tag..."
                  className={cn(getInputStyles(), "flex-1")}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddTag}
                  className="text-white border-white/20"
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="text-sm font-medium text-white/80 mb-3">Social Links</p>

              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs">Website</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://..."
                          className={getInputStyles()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instagram_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs">Instagram</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://instagram.com/..."
                          className={getInputStyles()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="youtube_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs">YouTube</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://youtube.com/@..."
                          className={getInputStyles()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tiktok_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs">TikTok</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://tiktok.com/@..."
                          className={getInputStyles()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twitter_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs">Twitter / X</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://x.com/..."
                          className={getInputStyles()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facebook_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs">Facebook</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://facebook.com/..."
                          className={getInputStyles()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="text-white border-white/20"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isUploading ? 'Uploading...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
