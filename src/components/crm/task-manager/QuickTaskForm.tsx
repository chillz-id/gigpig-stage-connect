import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import type { TaskPriority } from '@/types/task';
import type { TaskAssigneeOption } from '@/hooks/useTaskAssignees';
import type { QuickTaskFormState } from '@/hooks/crm/useTaskManagerState';

interface QuickTaskFormProps {
  isOpen: boolean;
  form: QuickTaskFormState;
  assignees: TaskAssigneeOption[];
  isSubmitting: boolean;
  onChange: (updates: Partial<QuickTaskFormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const QuickTaskForm = ({
  isOpen,
  form,
  assignees,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
}: QuickTaskFormProps) => {
  if (!isOpen) return null;

  const handlePriorityChange = (value: TaskPriority) => {
    onChange({ priority: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick task creation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quick-task-title">Title</Label>
            <Input
              id="quick-task-title"
              placeholder="Confirm booking with venue"
              value={form.title}
              onChange={(event) => onChange({ title: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-task-due">Due date</Label>
            <Input
              id="quick-task-due"
              type="date"
              value={form.dueDate}
              onChange={(event) => onChange({ dueDate: event.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quick-task-priority">Priority</Label>
            <Select value={form.priority} onValueChange={(value) => handlePriorityChange(value as TaskPriority)}>
              <SelectTrigger id="quick-task-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-task-assignee">Assignee</Label>
            <Select
              value={form.assignee}
              onValueChange={(value) => onChange({ assignee: value as QuickTaskFormState['assignee'] })}
            >
              <SelectTrigger id="quick-task-assignee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {assignees.map((assignee) => (
                  <SelectItem key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quick-task-description">Description</Label>
          <Textarea
            id="quick-task-description"
            placeholder="Add any context or next steps…"
            value={form.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create task
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
