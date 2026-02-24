/**
 * ReviewPostCard Component
 * Displays a single AI-generated draft with edit/approve/reject actions.
 */

import { useState } from 'react';
import {
  Check,
  X,
  Edit3,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Trash2,
  Save,
  Send,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ContentDraft } from '@/types/social';

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-500/10 text-pink-600 border-pink-200',
  facebook: 'bg-blue-500/10 text-blue-600 border-blue-200',
  tiktok: 'bg-zinc-900/10 text-zinc-800 border-zinc-200',
  twitter: 'bg-sky-500/10 text-sky-600 border-sky-200',
  youtube: 'bg-red-500/10 text-red-600 border-red-200',
  linkedin: 'bg-blue-700/10 text-blue-700 border-blue-200',
  threads: 'bg-zinc-800/10 text-zinc-700 border-zinc-200',
  bluesky: 'bg-blue-400/10 text-blue-500 border-blue-200',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  approved: 'bg-green-500/10 text-green-700 border-green-200',
  rejected: 'bg-red-500/10 text-red-700 border-red-200',
  scheduled: 'bg-blue-500/10 text-blue-700 border-blue-200',
  published: 'bg-green-600/10 text-green-800 border-green-300',
  failed: 'bg-red-600/10 text-red-800 border-red-300',
};

interface ReviewPostCardProps {
  draft: ContentDraft;
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, notes?: string) => void;
  onUpdate: (id: string, updates: Partial<Pick<ContentDraft, 'caption' | 'hashtags' | 'scheduled_for'>>) => void;
  onDelete: (id: string) => void;
  onPublish: (draft: ContentDraft) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  isUpdating?: boolean;
  isPublishing?: boolean;
}

export function ReviewPostCard({
  draft,
  onApprove,
  onReject,
  onUpdate,
  onDelete,
  onPublish,
  isApproving,
  isRejecting,
  isUpdating,
  isPublishing,
}: ReviewPostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(draft.caption);
  const [editHashtags, setEditHashtags] = useState(draft.hashtags?.join(' ') ?? '');
  const [reviewNotes, setReviewNotes] = useState('');

  const PlatformIcon = PLATFORM_ICONS[draft.platform] ?? Clock;
  const platformColor = PLATFORM_COLORS[draft.platform] ?? 'bg-gray-100 text-gray-600';
  const statusStyle = STATUS_STYLES[draft.status] ?? '';

  const handleSaveEdit = () => {
    const hashtags = editHashtags
      .split(/[\s,]+/)
      .map((h) => h.replace(/^#/, '').trim())
      .filter(Boolean);

    onUpdate(draft.id, {
      caption: editCaption,
      hashtags: hashtags.length > 0 ? hashtags : undefined,
    });
    setIsEditing(false);
  };

  const canReview = draft.status === 'draft';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${platformColor} capitalize`}>
              <PlatformIcon className="mr-1 h-3 w-3" />
              {draft.platform}
            </Badge>
            <Badge className={`${statusStyle} capitalize`}>
              {draft.status}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {draft.post_type}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {canReview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(draft.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Caption</Label>
              <Textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={4}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {editCaption.length} characters
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hashtags</Label>
              <Input
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                placeholder="comedy standup sydney"
                className="text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isUpdating}
              >
                <Save className="mr-1 h-3 w-3" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditCaption(draft.caption);
                  setEditHashtags(draft.hashtags?.join(' ') ?? '');
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap">{draft.caption}</p>
            {draft.hashtags && draft.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {draft.hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </>
        )}

        {draft.media_urls && draft.media_urls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-1">
            {draft.media_urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Media ${i + 1}`}
                className="h-16 w-16 rounded object-cover flex-shrink-0"
              />
            ))}
          </div>
        )}

        {draft.scheduled_for && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Scheduled: {new Date(draft.scheduled_for).toLocaleString()}
          </p>
        )}

        {draft.ai_model && (
          <p className="text-xs text-muted-foreground">
            Generated by: {draft.ai_model}
          </p>
        )}

        {/* Review actions */}
        {canReview && !isEditing && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              placeholder="Review notes (optional)"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="text-sm flex-1"
            />
            <Button
              size="sm"
              onClick={() => onApprove(draft.id, reviewNotes || undefined)}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="mr-1 h-3 w-3" />
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onReject(draft.id, reviewNotes || undefined)}
              disabled={isRejecting}
            >
              <X className="mr-1 h-3 w-3" />
              Reject
            </Button>
          </div>
        )}

        {/* Publish button for approved drafts */}
        {draft.status === 'approved' && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              size="sm"
              onClick={() => onPublish(draft)}
              disabled={isPublishing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPublishing ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Send className="mr-1 h-3 w-3" />
              )}
              Schedule on Metricool
            </Button>
          </div>
        )}

        {/* Review info for already-reviewed drafts */}
        {draft.reviewed_at && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            Reviewed {new Date(draft.reviewed_at).toLocaleString()}
            {draft.review_notes && ` — ${draft.review_notes}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
