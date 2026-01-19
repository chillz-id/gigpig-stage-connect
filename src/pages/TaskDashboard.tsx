// Task Management Dashboard - Main page for task management
import React, { useState, useMemo } from 'react';
import { Plus, Filter, Calendar, BarChart3, FileText, Search, SortAsc } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import TaskList from '@/components/tasks/TaskList';
import TaskKanbanBoard from '@/components/tasks/TaskKanbanBoard';
import TaskCalendarView from '@/components/tasks/TaskCalendarView';
import TaskStatisticsWidget from '@/components/tasks/TaskStatisticsWidget';
import CreateTaskDialog from '@/components/tasks/CreateTaskDialog';
import TaskTemplateLibrary from '@/components/tasks/TaskTemplateLibrary';
import TaskFiltersPanel from '@/components/tasks/TaskFiltersPanel';

import { useTaskDashboard, useUserTaskStatistics } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import type { TaskFilters, TaskSort, TaskStatus, TaskPriority, TaskCategory } from '@/types/task';

export default function TaskDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters and sorting state
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sort, setSort] = useState<TaskSort>({
    field: 'created_at',
    direction: 'desc'
  });

  // Fetch dashboard data
  const dashboard = useTaskDashboard();
  const userStats = useUserTaskStatistics();

  // Combine search with filters
  const combinedFilters = useMemo(() => ({
    ...filters,
    ...(searchQuery && { search: searchQuery })
  }), [filters, searchQuery]);

  // Quick filter functions
  const handleQuickFilter = (quickFilter: string) => {
    const today = new Date().toISOString().split('T')[0];
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    switch (quickFilter) {
      case 'my-tasks':
        setFilters({ assignee_id: [user?.id || ''] });
        break;
      case 'due-today':
        setFilters({
          due_date_range: { start: today, end: today },
          status: ['pending', 'in_progress']
        });
        break;
      case 'due-this-week':
        setFilters({
          due_date_range: { start: today, end: oneWeekFromNow },
          status: ['pending', 'in_progress']
        });
        break;
      case 'overdue':
        setFilters({ is_overdue: true });
        break;
      case 'high-priority':
        setFilters({ priority: ['urgent', 'high'] });
        break;
      case 'in-progress':
        setFilters({ status: ['in_progress'] });
        break;
      case 'completed':
        setFilters({ status: ['completed'] });
        break;
      case 'all':
      default:
        setFilters({});
        break;
    }
  };

  // Statistics cards data
  const statsCards = [
    {
      title: 'Total Tasks',
      value: userStats.data?.total_tasks || 0,
      description: 'All your tasks',
      icon: BarChart3,
    },
    {
      title: 'Due Today',
      value: dashboard.tasksDueToday.length,
      description: 'Tasks due today',
      icon: Calendar,
      variant: 'warning' as const,
    },
    {
      title: 'Overdue',
      value: dashboard.overdueTasks.length,
      description: 'Past due date',
      icon: Calendar,
      variant: 'destructive' as const,
    },
    {
      title: 'Completion Rate',
      value: userStats.data?.completion_rate ? `${Math.round(userStats.data.completion_rate)}%` : '0%',
      description: 'Tasks completed',
      icon: BarChart3,
      variant: 'success' as const,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-gray-600 mt-1">
            Organize and track your tasks efficiently
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={templateLibraryOpen} onOpenChange={setTemplateLibraryOpen}>
            <DialogTrigger asChild>
              <Button className="professional-button flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Task Templates</DialogTitle>
              </DialogHeader>
              <TaskTemplateLibrary onTemplateApplied={() => {
                setTemplateLibraryOpen(false);
                dashboard.refetch();
              }} />
            </DialogContent>
          </Dialog>

          <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <CreateTaskDialog 
                onSuccess={() => {
                  setCreateTaskOpen(false);
                  dashboard.refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <TaskStatisticsWidget
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            variant={stat.variant}
          />
        ))}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          className={cn(
            "professional-button",
            !Object.keys(filters).length && 'bg-primary text-primary-foreground'
          )}
          size="sm"
          onClick={() => handleQuickFilter('all')}
        >
          All Tasks
        </Button>
        <Button
          className={cn(
            "professional-button",
            filters.assignee_id?.includes(user?.id || '') && 'bg-primary text-primary-foreground'
          )}
          size="sm"
          onClick={() => handleQuickFilter('my-tasks')}
        >
          My Tasks
        </Button>
        <Button
          className={`professional-button ${filters.due_date_range?.start === new Date().toISOString().split('T')[0] ? 'bg-primary text-primary-foreground' : ''}`}
          size="sm"
          onClick={() => handleQuickFilter('due-today')}
        >
          Due Today
          {dashboard.tasksDueToday.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {dashboard.tasksDueToday.length}
            </Badge>
          )}
        </Button>
        <Button
          className="professional-button"
          size="sm"
          onClick={() => handleQuickFilter('due-this-week')}
        >
          Due This Week
          {dashboard.tasksDueThisWeek.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {dashboard.tasksDueThisWeek.length}
            </Badge>
          )}
        </Button>
        <Button
          className={`professional-button ${filters.is_overdue ? 'bg-destructive text-destructive-foreground' : ''}`}
          size="sm"
          onClick={() => handleQuickFilter('overdue')}
        >
          Overdue
          {dashboard.overdueTasks.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {dashboard.overdueTasks.length}
            </Badge>
          )}
        </Button>
        <Button
          className={`professional-button ${filters.priority?.includes('urgent') || filters.priority?.includes('high') ? 'bg-primary text-primary-foreground' : ''}`}
          size="sm"
          onClick={() => handleQuickFilter('high-priority')}
        >
          High Priority
        </Button>
        <Button
          className={`professional-button ${filters.status?.includes('in_progress') ? 'bg-primary text-primary-foreground' : ''}`}
          size="sm"
          onClick={() => handleQuickFilter('in-progress')}
        >
          In Progress
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={sort.field}
          onValueChange={(field) => setSort(prev => ({ ...prev, field: field as any }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Created Date</SelectItem>
            <SelectItem value="updated_at">Updated Date</SelectItem>
            <SelectItem value="due_date">Due Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>

        <Button
          className="professional-button flex items-center gap-2"
          size="sm"
          onClick={() => setSort(prev => ({
            ...prev,
            direction: prev.direction === 'asc' ? 'desc' : 'asc'
          }))}
        >
          <SortAsc className="w-4 h-4" />
          {sort.direction === 'asc' ? 'Asc' : 'Desc'}
        </Button>

        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogTrigger asChild>
            <Button className="professional-button flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {Object.keys(filters).length > 0 && (
                <Badge variant="default" className="ml-1">
                  {Object.keys(filters).length}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filter Tasks</DialogTitle>
            </DialogHeader>
            <TaskFiltersPanel
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setFiltersOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* View Selector */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <TaskList
            filters={combinedFilters}
            sort={sort}
            onTaskUpdate={() => dashboard.refetch()}
          />
        </TabsContent>

        <TabsContent value="kanban" className="mt-6">
          <TaskKanbanBoard
            filters={combinedFilters}
            onTaskUpdate={() => dashboard.refetch()}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <TaskCalendarView
            filters={combinedFilters}
            onTaskUpdate={() => dashboard.refetch()}
          />
        </TabsContent>
      </Tabs>

      {/* Loading State */}
      {dashboard.isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}