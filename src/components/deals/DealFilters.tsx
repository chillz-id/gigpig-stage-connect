import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

export interface DealFilters {
  search: string;
  priority: string;
  assignedTo: string;
  sortBy: string;
}

interface DealFiltersProps {
  filters: DealFilters;
  onFiltersChange: (filters: DealFilters) => void;
  assignees?: Array<{ id: string; name: string }>;
}

export const DealFiltersComponent = ({
  filters,
  onFiltersChange,
  assignees = [],
}: DealFiltersProps) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handlePriorityChange = (value: string) => {
    onFiltersChange({ ...filters, priority: value });
  };

  const handleAssigneeChange = (value: string) => {
    onFiltersChange({ ...filters, assignedTo: value });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      search: "",
      priority: "all",
      assignedTo: "all",
      sortBy: "value-desc",
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.priority !== "all" ||
    filters.assignedTo !== "all" ||
    filters.sortBy !== "value-desc";

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border rounded-lg">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals by comedian, event, or venue..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Priority Filter */}
        <Select value={filters.priority} onValueChange={handlePriorityChange}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="low">Low Priority</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignee Filter */}
        <Select value={filters.assignedTo} onValueChange={handleAssigneeChange}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Assigned to" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {assignees.map((assignee) => (
              <SelectItem key={assignee.id} value={assignee.id}>
                {assignee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value-desc">Value (High to Low)</SelectItem>
            <SelectItem value="value-asc">Value (Low to High)</SelectItem>
            <SelectItem value="date-desc">Date (Newest)</SelectItem>
            <SelectItem value="date-asc">Date (Oldest)</SelectItem>
            <SelectItem value="updated-desc">Recently Updated</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearFilters}
            className="shrink-0"
            title="Clear filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-muted-foreground">Active filters:</span>
          {filters.search && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
              Search: "{filters.search}"
            </span>
          )}
          {filters.priority !== "all" && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
              Priority: {filters.priority}
            </span>
          )}
          {filters.assignedTo !== "all" && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
              Assignee:{" "}
              {assignees.find((a) => a.id === filters.assignedTo)?.name ||
                filters.assignedTo}
            </span>
          )}
          {filters.sortBy !== "value-desc" && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
              Sort: {filters.sortBy.replace("-", " ")}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
