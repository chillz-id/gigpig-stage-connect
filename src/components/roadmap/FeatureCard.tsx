import { FeatureRequest } from '@/services/roadmap/roadmap-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useVoteFeature, useUnvoteFeature } from '@/hooks/useRoadmap';
import { Heart, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  feature: FeatureRequest;
  onClick: (feature: FeatureRequest) => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, feature: FeatureRequest) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  ui_ux: 'UI/UX',
  performance: 'Performance',
  integration: 'Integration',
  new_feature: 'New Feature',
  bug_fix: 'Bug Fix',
};

export function FeatureCard({
  feature,
  onClick,
  isDraggable = false,
  onDragStart,
  onDragEnd,
}: FeatureCardProps) {
  const hasVoted = feature.user_has_voted || false;
  const voteFeatureMutation = useVoteFeature();
  const unvoteFeatureMutation = useUnvoteFeature();

  const handleVoteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      if (hasVoted) {
        await unvoteFeatureMutation.mutateAsync(feature.id);
        toast.success('Vote removed');
      } else {
        await voteFeatureMutation.mutateAsync(feature.id);
        toast.success('Vote added');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to update vote');
    }
  };

  const truncateDescription = (text: string | null, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        isDraggable && 'cursor-move'
      )}
      draggable={isDraggable}
      onDragStart={(e) => onDragStart?.(e, feature)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(feature)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-sm line-clamp-2">{feature.title}</h3>

        {/* Description preview */}
        {feature.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {truncateDescription(feature.description, 100)}
          </p>
        )}

        {/* Category badge */}
        {feature.category && (
          <Badge variant="secondary" className="text-xs">
            {CATEGORY_LABELS[feature.category] || feature.category}
          </Badge>
        )}

        {/* Footer: Vote button, comment count, creator */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            {/* Vote button with heart */}
            <button
              onClick={handleVoteClick}
              disabled={
                voteFeatureMutation.isPending ||
                unvoteFeatureMutation.isPending
              }
              className="flex flex-col items-center gap-0.5 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-semibold">{feature.vote_count || 0}</span>
              <Heart
                className={cn(
                  'h-5 w-5 transition-all duration-200',
                  hasVoted
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-400 group-hover:text-red-400 group-hover:scale-110'
                )}
              />
            </button>

            {/* Comment count */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageCircle className="h-3 w-3" />
              <span>{feature.comment_count || 0}</span>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-1">
            <Avatar className="h-6 w-6">
              {feature.creator_avatar && (
                <AvatarImage src={feature.creator_avatar} alt={feature.creator_name} />
              )}
              <AvatarFallback className="text-[10px]">
                {getInitials(feature.creator_name || 'U')}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
