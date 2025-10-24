import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high";
  due_date?: string;
}

interface TaskKanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export default function TaskKanbanBoard({ tasks, onTaskClick }: TaskKanbanBoardProps) {
  const columns = [
    { id: "pending", title: "To Do", status: "pending" as const },
    { id: "in_progress", title: "In Progress", status: "in_progress" as const },
    { id: "completed", title: "Done", status: "completed" as const },
  ];

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((column) => {
        const columnTasks = tasks?.filter((task) => task.status === column.status) || [];

        return (
          <Card key={column.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {column.title}
                <Badge variant="secondary" className="ml-2">
                  {columnTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {columnTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks
                </p>
              ) : (
                columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="p-3 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onTaskClick?.(task)}
                  >
                    <h4 className="font-medium text-sm mb-2">{task.title}</h4>
                    <div className="flex items-center gap-2">
                      {task.priority && (
                        <Badge className={getPriorityColor(task.priority)} variant="secondary">
                          {task.priority}
                        </Badge>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
