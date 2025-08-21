
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X, Copy, ExternalLink } from 'lucide-react';
import { useProfileUrl } from '@/hooks/useProfileUrl';
import { useToast } from '@/hooks/use-toast';

interface ProfileUrlEditorProps {
  userId: string;
  currentSlug?: string;
  userName?: string;
  isOwner: boolean;
}

export const ProfileUrlEditor: React.FC<ProfileUrlEditorProps> = ({
  userId,
  currentSlug,
  userName,
  isOwner
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentSlug || '');
  const { isUpdating, updateProfileUrl, generateSlugFromName } = useProfileUrl();
  const { toast } = useToast();

  const baseUrl = window.location.origin;
  const profileUrl = `${baseUrl}/comedian/${currentSlug || 'profile'}`;

  useEffect(() => {
    setEditValue(currentSlug || '');
  }, [currentSlug]);

  const handleSave = async () => {
    if (!editValue.trim()) {
      toast({
        title: "Invalid URL",
        description: "Profile URL cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const { error } = await updateProfileUrl(userId, editValue.trim());
    if (!error) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(currentSlug || '');
    setIsEditing(false);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "URL copied",
        description: "Profile URL has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy URL to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleGenerateFromName = () => {
    if (userName) {
      const generatedSlug = generateSlugFromName(userName);
      setEditValue(generatedSlug);
    }
  };

  if (!currentSlug && !isOwner) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        <ExternalLink className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">Profile URL:</span>
      </div>
      
      {isEditing && isOwner ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{baseUrl}/comedian/</span>
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="your-profile-name"
              className="flex-1"
              disabled={isUpdating}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isUpdating}
            >
              <Check className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
            {userName && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleGenerateFromName}
                disabled={isUpdating}
              >
                Use Name
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
            {profileUrl}
          </code>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyUrl}
          >
            <Copy className="w-3 h-3" />
          </Button>
          {isOwner && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
