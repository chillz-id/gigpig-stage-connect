import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ManagerType,
  MANAGER_TYPE_CONFIGS,
  OrganizationPermissions,
  PermissionScope,
  SCOPE_CONFIGS,
} from '@/types/permissions';
import {
  Briefcase,
  Mic,
  Share2,
  Route,
  Handshake,
  FileText,
  DollarSign,
  Shield,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

interface ManagerTypeBadgeProps {
  type: ManagerType;
  className?: string;
}

const managerIconMap: Record<ManagerType, React.ComponentType<{ className?: string }>> = {
  general: Briefcase,
  comedian_manager: Mic,
  social_media: Share2,
  tour_manager: Route,
  booking_manager: Handshake,
  content_manager: FileText,
  financial_manager: DollarSign,
};

export function ManagerTypeBadge({ type, className = '' }: ManagerTypeBadgeProps) {
  const config = MANAGER_TYPE_CONFIGS[type];
  const Icon = managerIconMap[type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="professional-button" className={`gap-1 ${className}`}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface PermissionSummaryBadgesProps {
  permissions: OrganizationPermissions;
  maxBadges?: number;
  className?: string;
}

export function PermissionSummaryBadges({
  permissions,
  maxBadges = 3,
  className = '',
}: PermissionSummaryBadgesProps) {
  // Get scopes with full access (view + edit + delete)
  const fullAccessScopes = (Object.entries(permissions) as Array<
    [PermissionScope, { view: boolean; edit: boolean; delete: boolean }]
  >)
    .filter(([_, perms]) => perms.view && perms.edit && perms.delete)
    .map(([scope]) => scope);

  // Get scopes with edit access (view + edit, but not delete)
  const editScopes = (Object.entries(permissions) as Array<
    [PermissionScope, { view: boolean; edit: boolean; delete: boolean }]
  >)
    .filter(([_, perms]) => perms.view && perms.edit && !perms.delete)
    .map(([scope]) => scope);

  // Get scopes with view-only access
  const viewScopes = (Object.entries(permissions) as Array<
    [PermissionScope, { view: boolean; edit: boolean; delete: boolean }]
  >)
    .filter(([_, perms]) => perms.view && !perms.edit)
    .map(([scope]) => scope);

  const totalPermissions = fullAccessScopes.length + editScopes.length + viewScopes.length;

  if (totalPermissions === 0) {
    return (
      <Badge variant="secondary" className={className}>
        No permissions
      </Badge>
    );
  }

  // Show top scopes by permission level
  const topScopes = [
    ...fullAccessScopes.slice(0, maxBadges),
    ...editScopes.slice(0, Math.max(0, maxBadges - fullAccessScopes.length)),
    ...viewScopes.slice(
      0,
      Math.max(0, maxBadges - fullAccessScopes.length - editScopes.length)
    ),
  ];

  const remainingCount = totalPermissions - topScopes.length;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {topScopes.map((scope) => {
        const config = SCOPE_CONFIGS[scope];
        const perms = permissions[scope];
        let icon: React.ComponentType<{ className?: string }> = Eye;
        let variant: 'default' | 'secondary' | 'destructive' = 'secondary';

        if (perms.delete) {
          icon = Shield;
          variant = 'default';
        } else if (perms.edit) {
          icon = Edit;
          variant = 'secondary';
        }

        const Icon = icon;

        return (
          <TooltipProvider key={scope}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={variant} className="gap-1 text-xs">
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{config.label}</p>
                  <div className="text-xs space-y-0.5">
                    {perms.view && <p>✓ Can view</p>}
                    {perms.edit && <p>✓ Can edit</p>}
                    {perms.delete && <p>✓ Can delete</p>}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="professional-button text-xs">
                +{remainingCount} more
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {remainingCount} more permission scope{remainingCount > 1 ? 's' : ''}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

interface CustomPermissionsBadgeProps {
  hasCustom: boolean;
  className?: string;
}

export function CustomPermissionsBadge({ hasCustom, className = '' }: CustomPermissionsBadgeProps) {
  if (!hasCustom) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="professional-button" className={`gap-1 bg-blue-50 text-blue-800 border-blue-300 ${className}`}>
            <Shield className="h-3 w-3" />
            Custom
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>This user has custom permissions configured</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
