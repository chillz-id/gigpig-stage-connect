import { BugReport } from '@/services/bugs/bug-service';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BugCardProps {
  bug: BugReport;
  onClick: (bug: BugReport) => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, bug: BugReport) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const SEVERITY_STYLES: Record<string, { icon: string; className: string }> = {
  critical: { icon: '🔴', className: 'bg-red-100 text-red-900 border-red-300' },
  high: { icon: '🟠', className: 'bg-orange-100 text-orange-900 border-orange-300' },
  medium: { icon: '🟡', className: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
  low: { icon: '⚪', className: 'bg-gray-100 text-gray-900 border-gray-300' },
};

const STATUS_LABELS: Record<string, string> = {
  reported: 'Reported',
  triaged: 'Triaged',
  in_progress: 'In Progress',
  fixed: 'Fixed',
  verified: 'Verified',
  closed: 'Closed',
};

const CATEGORY_LABELS: Record<string, string> = {
  ui: 'UI',
  functionality: 'Functionality',
  performance: 'Performance',
  security: 'Security',
  data: 'Data',
};

export function BugCard({
  bug,
  onClick,
  isDraggable = false,
  onDragStart,
  onDragEnd,
}: BugCardProps) {
  const severityStyle = SEVERITY_STYLES[bug.severity];

  const truncateText = (text: string | null, maxLength: number) => {
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
      onDragStart={(e) => onDragStart?.(e, bug)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(bug)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Severity badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn('text-xs font-medium', severityStyle.className)}
          >
            {severityStyle.icon} {bug.severity.toUpperCase()}
          </Badge>
          {bug.category && (
            <Badge variant="secondary" className="text-xs">
              {CATEGORY_LABELS[bug.category] || bug.category}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm line-clamp-2">{bug.title}</h3>

        {/* Description preview */}
        {bug.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {truncateText(bug.description, 100)}
          </p>
        )}

        {/* Footer: Comment count, reporter, assigned */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3">
            {/* Comment count */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageCircle className="h-3 w-3" />
              <span>{bug.comment_count || 0}</span>
            </div>

            {/* Reporter */}
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5">
                {bug.reporter_avatar && (
                  <AvatarImage src={bug.reporter_avatar} alt={bug.reporter_name} />
                )}
                <AvatarFallback className="text-[8px]">
                  {getInitials(bug.reporter_name || 'U')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Assigned to */}
          {bug.assigned_to && (
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5 border-2 border-green-500">
                {bug.assigned_avatar && (
                  <AvatarImage src={bug.assigned_avatar} alt={bug.assigned_name} />
                )}
                <AvatarFallback className="text-[8px] bg-green-100">
                  {getInitials(bug.assigned_name || 'A')}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
