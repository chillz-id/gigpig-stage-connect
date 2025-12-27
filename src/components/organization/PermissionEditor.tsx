import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  PermissionScope,
  PermissionAction,
  OrganizationPermissions,
  PERMISSION_SCOPES,
  SCOPE_CONFIGS,
  PermissionSet,
} from '@/types/permissions';
import {
  DollarSign,
  Users,
  Calendar,
  Image,
  Share2,
  CheckSquare,
  MessageCircle,
  Handshake,
  BarChart3,
} from 'lucide-react';

interface PermissionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  currentPermissions: OrganizationPermissions;
  onSave: (permissions: OrganizationPermissions) => void;
  isLoading?: boolean;
}

const iconMap: Record<PermissionScope, React.ComponentType<{ className?: string }>> = {
  financial: DollarSign,
  team: Users,
  events: Calendar,
  media: Image,
  social: Share2,
  tasks: CheckSquare,
  messages: MessageCircle,
  bookings: Handshake,
  analytics: BarChart3,
};

export function PermissionEditor({
  open,
  onOpenChange,
  userName,
  currentPermissions,
  onSave,
  isLoading = false,
}: PermissionEditorProps) {
  const [permissions, setPermissions] = useState<OrganizationPermissions>(currentPermissions);
  const [hasChanges, setHasChanges] = useState(false);

  const updatePermission = (
    scope: PermissionScope,
    action: PermissionAction,
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [scope]: {
        ...prev[scope],
        [action]: value,
      },
    }));
    setHasChanges(true);
  };

  const setScopePermissions = (scope: PermissionScope, permSet: Partial<PermissionSet>) => {
    setPermissions((prev) => ({
      ...prev,
      [scope]: {
        ...prev[scope],
        ...permSet,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(permissions);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setPermissions(currentPermissions);
    setHasChanges(false);
    onOpenChange(false);
  };

  const renderPermissionRow = (scope: PermissionScope) => {
    const config = SCOPE_CONFIGS[scope];
    const Icon = iconMap[scope];
    const scopePerms = permissions[scope];

    return (
      <div key={scope} className="space-y-3">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="font-medium text-sm">{config.label}</p>
                <p className="text-xs text-gray-500">{config.description}</p>
              </div>
              {/* Quick actions */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    setScopePermissions(scope, { view: false, edit: false, delete: false })
                  }
                >
                  None
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    setScopePermissions(scope, { view: true, edit: true, delete: true })
                  }
                >
                  All
                </Button>
              </div>
            </div>

            {/* Permission toggles */}
            <div className="flex gap-6 mt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id={`${scope}-view`}
                  checked={scopePerms.view}
                  onCheckedChange={(checked) => updatePermission(scope, 'view', checked)}
                />
                <Label htmlFor={`${scope}-view`} className="text-xs cursor-pointer">
                  View
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id={`${scope}-edit`}
                  checked={scopePerms.edit}
                  onCheckedChange={(checked) => updatePermission(scope, 'edit', checked)}
                  disabled={!scopePerms.view}
                />
                <Label
                  htmlFor={`${scope}-edit`}
                  className={`text-xs cursor-pointer ${!scopePerms.view ? 'opacity-50' : ''}`}
                >
                  Edit
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id={`${scope}-delete`}
                  checked={scopePerms.delete}
                  onCheckedChange={(checked) => updatePermission(scope, 'delete', checked)}
                  disabled={!scopePerms.edit}
                />
                <Label
                  htmlFor={`${scope}-delete`}
                  className={`text-xs cursor-pointer ${!scopePerms.edit ? 'opacity-50' : ''}`}
                >
                  Delete
                </Label>
              </div>
            </div>
          </div>
        </div>
        <Separator />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Permissions for {userName}</DialogTitle>
          <DialogDescription>
            Configure what {userName} can view, edit, and delete in this organization.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {PERMISSION_SCOPES.map((scope) => renderPermissionRow(scope))}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button className="professional-button" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isLoading}>
            {isLoading ? 'Saving...' : 'Save Permissions'}
          </Button>
        </DialogFooter>

        {hasChanges && (
          <div className="absolute top-4 right-16">
            <Badge className="professional-button bg-yellow-50 text-yellow-800 border-yellow-300">
              Unsaved changes
            </Badge>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
