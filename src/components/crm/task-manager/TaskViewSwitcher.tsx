import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Layers, LayoutList, Kanban, Plus } from 'lucide-react';
import type { TaskManagerView } from '@/hooks/crm/useTaskManagerState';
import type { TaskTemplate } from '@/types/task';

interface TaskViewSwitcherProps {
  view: TaskManagerView;
  onViewChange: (value: TaskManagerView) => void;
  templates: TaskTemplate[];
  selectedTemplateId?: string;
  onTemplateChange: (templateId?: string) => void;
  onOpenTemplateDialog: () => void;
  onToggleQuickTask: () => void;
  isQuickTaskOpen: boolean;
}

export const TaskViewSwitcher = ({
  view,
  onViewChange,
  templates,
  selectedTemplateId,
  onTemplateChange,
  onOpenTemplateDialog,
  onToggleQuickTask,
  isQuickTaskOpen,
}: TaskViewSwitcherProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tabs value={view} onValueChange={(value) => onViewChange(value as TaskManagerView)}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="kanban" className="gap-2">
            <Kanban className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <LayoutList className="h-4 w-4" />
            List
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <Select
          value={selectedTemplateId || ''}
          onValueChange={(value) => onTemplateChange(value || undefined)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Task templates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select template</SelectItem>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={onOpenTemplateDialog}
          disabled={!selectedTemplateId}
          className="gap-2"
        >
          <Layers className="h-4 w-4" />
          Apply template
        </Button>
      </div>

      <Button onClick={onToggleQuickTask} className="gap-2">
        <Plus className="h-4 w-4" />
        {isQuickTaskOpen ? 'Cancel' : 'Quick task'}
      </Button>
    </div>
  );
};
