import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high";
  due_date?: string;
}

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export default function TaskList({ tasks, onTaskClick }: TaskListProps) {
  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

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

  if (!tasks || tasks.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No tasks found. Create your first task to get started!
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className="p-4 hover:bg-accent cursor-pointer transition-colors"
          onClick={() => onTaskClick?.(task)}
        >
          <div className="flex items-start gap-3">
            {getStatusIcon(task.status)}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{task.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                {task.priority && (
                  <Badge className={getPriorityColor(task.priority)} variant="secondary">
                    {task.priority}
                  </Badge>
                )}
                {task.due_date && (
                  <span className="text-sm text-muted-foreground">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
