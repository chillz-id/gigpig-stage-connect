import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw, Save, Trash2 } from 'lucide-react';
import type { ColumnTemplate } from '@/types/column-config';

interface ColumnTemplateManagerProps {
  templates: ColumnTemplate[];
  activeTemplateId: string | null;
  onSelect: (templateId: string) => void;
  onRequestSave: () => void;
  onRequestDelete: (templateId: string) => void;
  onResetToDefaults: () => void;
}

export const ColumnTemplateManager = ({
  templates,
  activeTemplateId,
  onSelect,
  onRequestSave,
  onRequestDelete,
  onResetToDefaults,
}: ColumnTemplateManagerProps) => {
  const activeTemplate = templates.find((template) => template.id === activeTemplateId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="column-template-select">Column Template</Label>
        <Button variant="ghost" size="sm" onClick={onResetToDefaults}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
      <Select value={activeTemplateId || 'default'} onValueChange={onSelect}>
        <SelectTrigger id="column-template-select">
          <SelectValue placeholder="Select a template" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeTemplate?.description && (
        <p className="text-sm text-muted-foreground">{activeTemplate.description}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button className="professional-button justify-start">
          <Save className="mr-2 h-4 w-4" />
          Save as New Template
        </Button>

        {activeTemplateId && !activeTemplate?.isDefault && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRequestDelete(activeTemplateId)}
            className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Current Template
          </Button>
        )}
      </div>
    </div>
  );
};
