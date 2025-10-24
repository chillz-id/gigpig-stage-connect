import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high";
  due_date?: string;
}

interface TaskCalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export default function TaskCalendarView({ tasks, onTaskClick }: TaskCalendarViewProps) {
  const getPriorityColor = (priority?: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Group tasks by date
  const tasksByDate = tasks?.reduce((acc, task) => {
    if (task.due_date) {
      const date = new Date(task.due_date).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
    }
    return acc;
  }, {} as Record<string, Task[]>) || {};

  const sortedDates = Object.keys(tasksByDate).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  );

  if (sortedDates.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No tasks with due dates found.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="font-semibold text-lg mb-3">
            {new Date(date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h3>
          <div className="space-y-2">
            {tasksByDate[date].map((task) => (
              <Card
                key={task.id}
                className="p-4 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => onTaskClick?.(task)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{task.title}</h4>
                  <div className="flex items-center gap-2">
                    {task.priority && (
                      <Badge className={getPriorityColor(task.priority)} variant="secondary">
                        {task.priority}
                      </Badge>
                    )}
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
