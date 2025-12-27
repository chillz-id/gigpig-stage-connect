import { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnConfig, ColumnDefinition, ColumnTemplate } from '@/types/column-config';
import { ColumnTemplateManager } from '@/components/crm/column-customizer/ColumnTemplateManager';
import { ColumnList } from '@/components/crm/column-customizer/ColumnList';
import { SaveTemplateDialog } from '@/components/crm/column-customizer/SaveTemplateDialog';
import { DeleteTemplateDialog } from '@/components/crm/column-customizer/DeleteTemplateDialog';
import { useColumnOrdering } from '@/hooks/crm/useColumnOrdering';

interface ColumnCustomizerProps {
  columnDefinitions: ColumnDefinition[];
  currentConfigs: ColumnConfig[];
  templates: ColumnTemplate[];
  activeTemplateId: string | null;
  onConfigsChange: (configs: ColumnConfig[]) => void;
  onTemplateSelect: (templateId: string) => void;
  onTemplateSave: (name: string, description?: string) => void;
  onTemplateDelete: (templateId: string) => void;
}

export const ColumnCustomizer = ({
  columnDefinitions,
  currentConfigs,
  templates,
  activeTemplateId,
  onConfigsChange,
  onTemplateSelect,
  onTemplateSave,
  onTemplateDelete,
}: ColumnCustomizerProps) => {
  const [open, setOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  const templatesWithDefaults = useMemo(() => templates, [templates]);

  const { orderedColumns, toggleVisibility, changeWidth, changeAlignment, moveColumn } = useColumnOrdering({
    columnDefinitions,
    columnConfigs: currentConfigs,
    onChange: onConfigsChange,
  });

  const handleResetToDefaults = () => {
    if (templatesWithDefaults.some((template) => template.id === 'default')) {
      onTemplateSelect('default');
      toast.success('Reset to default columns');
    }
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    onTemplateSave(newTemplateName, newTemplateDescription);
    setNewTemplateName('');
    setNewTemplateDescription('');
    setSaveDialogOpen(false);
    toast.success(`Template "${newTemplateName}" saved`);
  };

  const handleDeleteTemplate = () => {
    if (!templateToDelete) return;
    onTemplateDelete(templateToDelete);
    setTemplateToDelete(null);
    setDeleteDialogOpen(false);
    toast.success('Template deleted');
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className="professional-button" size="sm">
            <Settings2 className="mr-2 h-4 w-4" />
            Customize Columns
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Customize Table Columns</SheetTitle>
            <SheetDescription>Choose which columns to display and adjust their configuration.</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <ColumnTemplateManager
              templates={templatesWithDefaults}
              activeTemplateId={activeTemplateId}
              onSelect={(templateId) => {
                try {
                  onTemplateSelect(templateId);
                } catch (error) {
                  console.error(error);
                  toast.error('Unable to load template. Please try again.');
                }
              }}
              onRequestSave={() => setSaveDialogOpen(true)}
              onRequestDelete={(templateId) => {
                setTemplateToDelete(templateId);
                setDeleteDialogOpen(true);
              }}
              onResetToDefaults={handleResetToDefaults}
            />

            <Separator />

            <ColumnList
              columns={orderedColumns}
              onToggleVisibility={(columnId) => {
                const result = toggleVisibility(columnId);
                if (!result.success) {
                  if (result.error === 'required-column') {
                    const column = columnDefinitions.find((definition) => definition.id === columnId);
                    toast.error(`${column?.label ?? 'This'} column cannot be hidden`);
                  } else {
                    toast.error('Unable to update column visibility.');
                  }
                }
              }}
              onMove={moveColumn}
              onWidthChange={(columnId, width) => {
                const result = changeWidth(columnId, width);
                if (!result.success) {
                  const column = columnDefinitions.find((definition) => definition.id === columnId);
                  if (result.error === 'min-width') {
                    toast.error(`Minimum width for ${column?.label ?? 'this column'} is ${column?.minWidth}px`);
                  } else {
                    toast.error('Unable to update column width.');
                  }
                }
              }}
              onAlignmentChange={changeAlignment}
            />
          </div>
        </SheetContent>
      </Sheet>

      <SaveTemplateDialog
        open={saveDialogOpen}
        name={newTemplateName}
        description={newTemplateDescription}
        onNameChange={setNewTemplateName}
        onDescriptionChange={setNewTemplateDescription}
        onOpenChange={setSaveDialogOpen}
        onSubmit={handleSaveTemplate}
      />

      <DeleteTemplateDialog
        open={deleteDialogOpen}
        onOpenChange={(nextOpen) => {
          setDeleteDialogOpen(nextOpen);
          if (!nextOpen) {
            setTemplateToDelete(null);
          }
        }}
        onConfirm={handleDeleteTemplate}
      />
    </>
  );
};
