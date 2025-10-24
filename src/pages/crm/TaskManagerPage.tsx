import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { TaskFilters } from '@/components/crm/TaskFilters';
import { TaskList } from '@/components/crm/TaskList';
import { TaskKanban } from '@/components/crm/TaskKanban';
import ApplyTemplateDialog from '@/components/tasks/ApplyTemplateDialog';
import { TaskSummary } from '@/components/crm/task-manager/TaskSummary';
import { TaskViewSwitcher } from '@/components/crm/task-manager/TaskViewSwitcher';
import { QuickTaskForm } from '@/components/crm/task-manager/QuickTaskForm';
import { useTaskManagerState } from '@/hooks/crm/useTaskManagerState';
import type { Task } from '@/types/task';

export const TaskManagerPage = () => {
  const navigate = useNavigate();
  const {
    view,
    handleViewChange,
    filtersState,
    setFiltersState,
    resetFilters,
    summary,
    quickTask,
    templates,
    tasks,
    assignees,
    isUpdatingTask,
    handleStatusChange,
  } = useTaskManagerState();

  const handleTaskClick = (task: Task) => {
    navigate(`/crm/tasks/${task.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Stay on top of follow-ups, reminders, and operational work across the CRM.
          </p>
        </div>
        <TaskViewSwitcher
          view={view}
          onViewChange={handleViewChange}
          templates={templates.list}
          selectedTemplateId={templates.selectedId}
          onTemplateChange={(value) => templates.setSelectedId(value)}
          onOpenTemplateDialog={() => templates.setDialogOpen(true)}
          onToggleQuickTask={quickTask.toggle}
          isQuickTaskOpen={quickTask.isOpen}
        />
      </div>

      <TaskSummary metrics={summary} />

      <QuickTaskForm
        isOpen={quickTask.isOpen}
        form={quickTask.form}
        assignees={assignees.list}
        isSubmitting={quickTask.isSubmitting}
        onChange={quickTask.updateForm}
        onSubmit={quickTask.submit}
        onCancel={quickTask.close}
      />

      <TaskFilters
        value={filtersState}
        onChange={setFiltersState}
        assignees={assignees.list}
        isLoadingAssignees={assignees.isLoading}
        onReset={resetFilters}
      />

      <Separator />

      <Tabs value={view}>
        <TabsContent value="kanban" className="mt-0">
          <TaskKanban
            tasks={tasks.items}
            onTaskClick={handleTaskClick}
            onStatusChange={handleStatusChange}
            isLoading={tasks.isLoading}
            isUpdating={isUpdatingTask}
          />
        </TabsContent>
        <TabsContent value="list" className="mt-0">
          <TaskList
            tasks={tasks.items}
            onTaskClick={handleTaskClick}
            isLoading={tasks.isLoading}
            hasMore={tasks.hasNextPage}
            isLoadingMore={tasks.isFetchingNextPage}
            {...(tasks.hasNextPage ? { onLoadMore: tasks.fetchNextPage } : {})}
          />
        </TabsContent>
      </Tabs>

      <ApplyTemplateDialog
        open={templates.dialogOpen}
        onOpenChange={templates.setDialogOpen}
        templateId={templates.selectedId ?? ''}
        onSuccess={() => {
          templates.setDialogOpen(false);
          tasks.refetch();
        }}
        defaultValues={templates.defaults}
      />
    </div>
  );
};
