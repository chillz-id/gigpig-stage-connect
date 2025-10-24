import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskFiltersPanelProps {
  filters: {
    status?: "pending" | "in_progress" | "completed" | "all";
    priority?: "low" | "medium" | "high" | "all";
    showOverdue?: boolean;
  };
  onFiltersChange: (filters: TaskFiltersPanelProps["filters"]) => void;
}

export default function TaskFiltersPanel({ filters, onFiltersChange }: TaskFiltersPanelProps) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Filters</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value as TaskFiltersPanelProps["filters"]["status"],
              })
            }
          >
            <SelectTrigger id="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority-filter">Priority</Label>
          <Select
            value={filters.priority || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                priority: value as TaskFiltersPanelProps["filters"]["priority"],
              })
            }
          >
            <SelectTrigger id="priority-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="show-overdue"
            checked={filters.showOverdue || false}
            onCheckedChange={(checked) =>
              onFiltersChange({
                ...filters,
                showOverdue: checked === true,
              })
            }
          />
          <Label htmlFor="show-overdue" className="cursor-pointer">
            Show only overdue tasks
          </Label>
        </div>
      </div>
    </Card>
  );
}
