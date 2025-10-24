import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ManagerType, MANAGER_TYPE_CONFIGS } from '@/types/permissions';
import {
  Briefcase,
  Mic,
  Share2,
  Route,
  Handshake,
  FileText,
  DollarSign,
} from 'lucide-react';

interface ManagerTypeSelectorProps {
  value: ManagerType | null;
  onChange: (value: ManagerType | null) => void;
  disabled?: boolean;
}

const iconMap: Record<ManagerType, React.ComponentType<{ className?: string }>> = {
  general: Briefcase,
  comedian_manager: Mic,
  social_media: Share2,
  tour_manager: Route,
  booking_manager: Handshake,
  content_manager: FileText,
  financial_manager: DollarSign,
};

export function ManagerTypeSelector({ value, onChange, disabled }: ManagerTypeSelectorProps) {
  return (
    <Select
      value={value || 'none'}
      onValueChange={(val) => onChange(val === 'none' ? null : (val as ManagerType))}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select manager type">
          {value ? (
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = iconMap[value];
                const config = MANAGER_TYPE_CONFIGS[value];
                return (
                  <>
                    <Icon className="h-4 w-4" />
                    <span>{config.label}</span>
                  </>
                );
              })()}
            </div>
          ) : (
            'No specialized type'
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              No Type
            </Badge>
            <span className="text-xs text-gray-500">Use default permissions</span>
          </div>
        </SelectItem>
        {(Object.keys(MANAGER_TYPE_CONFIGS) as ManagerType[]).map((type) => {
          const config = MANAGER_TYPE_CONFIGS[type];
          const Icon = iconMap[type];
          return (
            <SelectItem key={type} value={type}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{config.label}</p>
                  <p className="text-xs text-gray-500">{config.description}</p>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
