import { Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  NotificationFilterPriority,
  NotificationFilterType,
} from '@/components/notifications/types';

interface NotificationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: NotificationFilterType;
  onTypeChange: (value: NotificationFilterType) => void;
  priorityFilter: NotificationFilterPriority;
  onPriorityChange: (value: NotificationFilterPriority) => void;
  showUnreadOnly: boolean;
  onToggleUnreadOnly: () => void;
}

const NotificationFilters = ({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeChange,
  priorityFilter,
  onPriorityChange,
  showUnreadOnly,
  onToggleUnreadOnly,
}: NotificationFiltersProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-300"
        />
      </div>
      <div className="flex gap-2">
        <Select value={typeFilter} onValueChange={(value) => onTypeChange(value as NotificationFilterType)}>
          <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="event">Events</SelectItem>
            <SelectItem value="booking">Bookings</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="reminder">Reminders</SelectItem>
            <SelectItem value="promotion">Promotions</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(value) => onPriorityChange(value as NotificationFilterPriority)}
        >
          <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleUnreadOnly}
          className={`text-white border-white/20 ${showUnreadOnly ? 'bg-purple-600' : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Unread
        </Button>
      </div>
    </div>
  );
};

export default NotificationFilters;
