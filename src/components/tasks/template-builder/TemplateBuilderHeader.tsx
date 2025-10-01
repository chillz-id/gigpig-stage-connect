import { Eye, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TemplateBuilderHeaderProps {
  isEditing: boolean;
  previewMode: boolean;
  onTogglePreview: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  onCancel?: () => void;
}

export function TemplateBuilderHeader({
  isEditing,
  previewMode,
  onTogglePreview,
  onSubmit,
  isSaving,
  onCancel
}: TemplateBuilderHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">
        {isEditing ? 'Edit Template' : 'Create Task Template'}
      </h1>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onTogglePreview}
          className="flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          {previewMode ? 'Edit Mode' : 'Preview Mode'}
        </Button>

        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}

        <Button
          onClick={onSubmit}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
}
