import { Kanban, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { TaskSummaryMetrics } from '@/hooks/crm/useTaskManagerState';

interface TaskSummaryProps {
  metrics: TaskSummaryMetrics;
}

export const TaskSummary = ({ metrics }: TaskSummaryProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-muted-foreground">Total tasks</p>
            <p className="text-2xl font-bold">{metrics.total}</p>
          </div>
          <Kanban className="h-8 w-8 text-purple-500" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-muted-foreground">Open</p>
            <p className="text-2xl font-bold">{metrics.open}</p>
          </div>
          <AlertCircle className="h-8 w-8 text-blue-500" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-destructive">{metrics.overdue}</p>
          </div>
          <Clock className="h-8 w-8 text-red-500" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{metrics.completed}</p>
          </div>
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </CardContent>
      </Card>
    </div>
  );
};
