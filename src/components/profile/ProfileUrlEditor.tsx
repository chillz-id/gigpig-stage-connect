
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X, Copy, ExternalLink } from 'lucide-react';
import { useProfileUrl } from '@/hooks/useProfileUrl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateSlugContent } from '@/utils/profanityFilter';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const [canEditUrl, setCanEditUrl] = useState(true);
  const [daysUntilEditable, setDaysUntilEditable] = useState(0);
  const [isCheckingCooldown, setIsCheckingCooldown] = useState(true);
  const { isUpdating, updateProfileUrl, generateSlugFromName } = useProfileUrl();
  const { toast } = useToast();

  const baseUrl = window.location.origin;
  const profileUrl = `${baseUrl}/comedian/${currentSlug || 'profile'}`;

  // Check if user can edit URL based on 30-day cooldown
  useEffect(() => {
    const checkCooldown = async () => {
      if (!userId || !isOwner) {
        setIsCheckingCooldown(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('url_slug_last_changed')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching slug change date:', error);
          // If error, allow editing (fail open)
          setCanEditUrl(true);
          setIsCheckingCooldown(false);
          return;
        }

        const lastChanged = data?.url_slug_last_changed;

        if (!lastChanged) {
          // Never changed before, allow editing
          setCanEditUrl(true);
          setDaysUntilEditable(0);
        } else {
          const lastChangedDate = new Date(lastChanged);
          const now = new Date();
          const daysSinceChange = Math.floor((now.getTime() - lastChangedDate.getTime()) / (1000 * 60 * 60 * 24));
          const COOLDOWN_DAYS = 30;

          if (daysSinceChange >= COOLDOWN_DAYS) {
            setCanEditUrl(true);
            setDaysUntilEditable(0);
          } else {
            setCanEditUrl(false);
            setDaysUntilEditable(COOLDOWN_DAYS - daysSinceChange);
          }
        }
      } catch (error) {
        console.error('Error in cooldown check:', error);
        // If error, allow editing (fail open)
        setCanEditUrl(true);
      } finally {
        setIsCheckingCooldown(false);
      }
    };

    checkCooldown();
  }, [userId, isOwner]);

  useEffect(() => {
    setEditValue(currentSlug || '');
  }, [currentSlug]);

  const handleSave = async () => {
    const trimmedValue = editValue.trim();

    if (!trimmedValue) {
      toast({
        title: "Invalid URL",
        description: "Profile URL cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Validate slug content (profanity check + format validation)
    const validation = validateSlugContent(trimmedValue);
    if (!validation.isValid) {
      toast({
        title: "Invalid URL",
        description: validation.reason,
        variant: "destructive",
      });
      return;
    }

    const { error } = await updateProfileUrl(userId, trimmedValue);
    if (!error) {
      setIsEditing(false);
      // Refresh cooldown check after successful save
      setIsCheckingCooldown(true);
      const checkCooldown = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('url_slug_last_changed')
            .eq('id', userId)
            .maybeSingle();

          const lastChanged = data?.url_slug_last_changed;
          if (lastChanged) {
            setCanEditUrl(false);
            setDaysUntilEditable(30);
          }
        } catch (error) {
          console.error('Error refreshing cooldown:', error);
        } finally {
          setIsCheckingCooldown(false);
        }
      };
      checkCooldown();
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
        <span className="text-muted-foreground">Sharable Url:</span>
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
              className="professional-button"
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                      disabled={!canEditUrl || isCheckingCooldown}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canEditUrl && !isCheckingCooldown && (
                  <TooltipContent>
                    <p>You can change your URL again in {daysUntilEditable} day{daysUntilEditable !== 1 ? 's' : ''}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );
};
