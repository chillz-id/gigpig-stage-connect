/**
 * PermissionsList Component
 *
 * Shared permissions UI for both series-level and event-level partner management.
 * Shows severity indicators, click-to-expand descriptions, and toggle switches.
 */

import { useState } from 'react';
import { Shield, Eye, Edit, DollarSign, Database, Info, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export type PermissionKey = 'is_admin' | 'can_view_details' | 'can_edit_event' | 'can_view_financials' | 'can_manage_financials' | 'can_receive_crm_data';

interface PermissionDef {
  key: PermissionKey;
  label: string;
  description: string;
  icon: typeof Eye;
  severity: 'critical' | 'high' | 'standard';
}

const PERMISSION_DEFS: PermissionDef[] = [
  {
    key: 'is_admin',
    label: 'Series Admin',
    description: 'Full control: can manage series settings, add/remove partners, create deals, and modify all events. This is the highest level of access.',
    icon: Shield,
    severity: 'critical',
  },
  {
    key: 'can_view_details',
    label: 'View Event Details',
    description: 'Can see event details including date, time, venue, lineup, and ticket sales numbers.',
    icon: Eye,
    severity: 'standard',
  },
  {
    key: 'can_edit_event',
    label: 'Edit Events',
    description: 'Can modify event details like title, description, lineup, and scheduling. Does not include financial changes.',
    icon: Edit,
    severity: 'high',
  },
  {
    key: 'can_view_financials',
    label: 'View Financials',
    description: 'Can see revenue figures, ticket sales income, deal terms, and settlement history. Read-only access.',
    icon: DollarSign,
    severity: 'high',
  },
  {
    key: 'can_manage_financials',
    label: 'Manage Financials',
    description: 'Can create and edit deals, settle payments, generate invoices, and manage all financial operations on your behalf.',
    icon: DollarSign,
    severity: 'critical',
  },
  {
    key: 'can_receive_crm_data',
    label: 'CRM Data Sync',
    description: 'Will receive attendee names, emails, and ticket data from events for their own CRM or mailing list. This shares customer data.',
    icon: Database,
    severity: 'high',
  },
];

interface PermissionsListProps {
  permissions: Partial<Record<PermissionKey, boolean>>;
  onToggle: (key: PermissionKey, checked: boolean) => void;
  title?: string;
  exclude?: PermissionKey[];
}

export function PermissionsList({ permissions, onToggle, title, exclude }: PermissionsListProps) {
  const [expandedKey, setExpandedKey] = useState<PermissionKey | null>(null);

  const defs = exclude ? PERMISSION_DEFS.filter(d => !exclude.includes(d.key)) : PERMISSION_DEFS;

  const severityStyles = {
    critical: 'border-red-500/30 bg-red-500/5',
    high: 'border-amber-500/30 bg-amber-500/5',
    standard: 'border-border',
  };

  const severityBadge = {
    critical: <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Critical</Badge>,
    high: <Badge variant="secondary" className="border-amber-500/50 text-amber-600 dark:text-amber-400 text-[10px] px-1.5 py-0">Sensitive</Badge>,
    standard: null,
  };

  return (
    <div className="space-y-3">
      {title && <Label>{title}</Label>}
      <div className="space-y-2">
        {defs.map(({ key, label, description, icon: Icon, severity }) => {
          const isOn = permissions[key] ?? false;
          const isExpanded = expandedKey === key;
          const isAdmin = key === 'is_admin';

          return (
            <div
              key={key}
              className={`rounded-lg border p-3 transition-colors ${
                isAdmin ? 'bg-purple-500/10 border-purple-500/30' : severityStyles[severity]
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Icon className={`h-4 w-4 shrink-0 ${isAdmin ? 'text-purple-500' : 'text-muted-foreground'}`} />
                  <span className={`text-sm ${isAdmin ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                  {severityBadge[severity]}
                  <button
                    type="button"
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                    className="inline-flex cursor-help rounded-full p-0.5 hover:bg-muted"
                  >
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
                <Switch
                  checked={isOn}
                  onCheckedChange={(checked) => onToggle(key, checked)}
                />
              </div>
              {isExpanded && (
                <div className={`mt-2 rounded-md px-3 py-2 text-xs leading-relaxed text-foreground ${
                  severity === 'critical'
                    ? 'bg-red-500/10'
                    : severity === 'high'
                    ? 'bg-amber-500/10'
                    : 'bg-muted'
                }`}>
                  <AlertCircle className="mr-1 inline h-3 w-3" />
                  {description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
