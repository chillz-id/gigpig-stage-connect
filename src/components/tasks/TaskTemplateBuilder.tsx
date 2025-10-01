// Task Template Builder - orchestrates template creation flows via modular sections
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { CreateTemplateFormData } from '@/types/task';

import { TemplateBuilderHeader } from './template-builder/TemplateBuilderHeader';
import { TemplateDetailsForm } from './template-builder/TemplateDetailsForm';
import { TemplateVariablesPanel } from './template-builder/TemplateVariablesPanel';
import { TemplateTasksPanel } from './template-builder/TemplateTasksPanel';
import { useTaskTemplateBuilder } from './template-builder/useTaskTemplateBuilder';

interface TaskTemplateBuilderProps {
  initialTemplate?: Partial<CreateTemplateFormData>;
  onSave?: (template: CreateTemplateFormData) => void;
  onCancel?: () => void;
}

export default function TaskTemplateBuilder({
  initialTemplate,
  onSave,
  onCancel
}: TaskTemplateBuilderProps) {
  const {
    form,
    fields,
    removeTaskItem,
    activeTab,
    setActiveTab,
    previewMode,
    togglePreviewMode,
    variableDialogOpen,
    handleVariableDialogChange,
    variableForm,
    setVariableForm,
    handleVariableSave,
    handleVariableEdit,
    handleVariableDelete,
    editingVariable,
    newTag,
    setNewTag,
    handleAddTag,
    handleRemoveTag,
    handleAddTaskItem,
    handleTaskDragEnd,
    submitTemplate,
    isSaving,
    getVariablePreview,
    priorityOptions,
    categoryOptions
  } = useTaskTemplateBuilder({ initialTemplate, onSave });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <TemplateBuilderHeader
        isEditing={!!initialTemplate}
        previewMode={previewMode}
        onTogglePreview={togglePreviewMode}
        onSubmit={submitTemplate}
        isSaving={isSaving}
        onCancel={onCancel}
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="template">Template Info</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-6">
          <TemplateDetailsForm
            form={form}
            newTag={newTag}
            onTagChange={setNewTag}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        </TabsContent>

        <TabsContent value="variables" className="space-y-6">
          <TemplateVariablesPanel
            form={form}
            variableDialogOpen={variableDialogOpen}
            onDialogChange={handleVariableDialogChange}
            variableForm={variableForm}
            setVariableForm={setVariableForm}
            onSaveVariable={handleVariableSave}
            onEditVariable={handleVariableEdit}
            onDeleteVariable={handleVariableDelete}
            editingVariable={editingVariable}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <TemplateTasksPanel
            form={form}
            fields={fields}
            onAddTask={handleAddTaskItem}
            onRemoveTask={removeTaskItem}
            onDragEnd={handleTaskDragEnd}
            previewMode={previewMode}
            getVariablePreview={getVariablePreview}
            priorityOptions={priorityOptions}
            categoryOptions={categoryOptions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
