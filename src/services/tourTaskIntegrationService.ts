// Tour Task Integration Service - Automatically creates tasks when tours are created or updated
import { tourService } from './tourService';
import { taskService } from './taskService';
import type { Tour, TourStop, TourCollaboration } from '@/types/tour';
import type { CreateTaskRequest, TaskTemplate, ApplyTemplateRequest } from '@/types/task';

class TourTaskIntegrationService {
  // =====================================
  // AUTOMATIC TASK CREATION
  // =====================================

  /**
   * Apply tour setup task template when a new tour is created
   */
  async applyTourSetupTasks(tour: Tour): Promise<void> {
    try {
      // Look for "New Tour Setup" template
      const templates = await taskService.getTaskTemplates();
      const tourSetupTemplate = templates.find(t => 
        t.name === 'New Tour Setup' && t.is_system_template
      );

      if (tourSetupTemplate) {
        const applyRequest: ApplyTemplateRequest = {
          template_id: tourSetupTemplate.id,
          target_id: tour.id,
          target_type: 'tour',
          variables: {
            tour_name: tour.name,
            tour_start_date: tour.start_date || 'TBD',
            tour_end_date: tour.end_date || 'TBD',
            tour_manager: tour.tour_manager_id,
            tour_type: tour.tour_type || 'comedy',
            budget: tour.budget?.toString() || '0'
          },
          assignee_id: tour.tour_manager_id,
          due_date_base: tour.start_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
        };

        await taskService.applyTaskTemplate(applyRequest);
      }

      // Create additional tour-specific tasks
      await this.createTourManagementTasks(tour);
    } catch (error) {
      console.error('Failed to apply tour setup tasks:', error);
      // Don't throw error - task creation failure shouldn't block tour creation
    }
  }

  /**
   * Create essential tour management tasks
   */
  private async createTourManagementTasks(tour: Tour): Promise<void> {
    const baseTasks: CreateTaskRequest[] = [
      {
        title: `Setup marketing materials for ${tour.name}`,
        description: `Create promotional materials including posters, social media content, and press releases for the ${tour.name} tour.`,
        creator_id: tour.tour_manager_id,
        assignee_id: tour.tour_manager_id,
        category: 'marketing',
        priority: 'medium',
        due_date: this.calculateDueDate(tour.start_date, -60), // 60 days before tour start
        metadata: {
          tour_id: tour.id,
          task_type: 'tour_marketing',
          auto_generated: true
        }
      },
      {
        title: `Finalize insurance and contracts for ${tour.name}`,
        description: `Ensure all insurance policies are in place and contracts are signed for the tour.`,
        creator_id: tour.tour_manager_id,
        assignee_id: tour.tour_manager_id,
        category: 'administrative',
        priority: 'high',
        due_date: this.calculateDueDate(tour.start_date, -30), // 30 days before tour start
        metadata: {
          tour_id: tour.id,
          task_type: 'tour_insurance',
          auto_generated: true
        }
      },
      {
        title: `Coordinate travel logistics for ${tour.name}`,
        description: `Arrange transportation, accommodation, and travel schedules for all tour participants.`,
        creator_id: tour.tour_manager_id,
        assignee_id: tour.tour_manager_id,
        category: 'travel',
        priority: 'high',
        due_date: this.calculateDueDate(tour.start_date, -21), // 3 weeks before tour start
        metadata: {
          tour_id: tour.id,
          task_type: 'tour_travel',
          auto_generated: true
        }
      }
    ];

    // Create budget-related tasks if budget is set
    if (tour.budget && tour.budget > 0) {
      baseTasks.push({
        title: `Setup budget tracking for ${tour.name}`,
        description: `Create budget tracking spreadsheet and expense monitoring system for the tour.`,
        creator_id: tour.tour_manager_id,
        assignee_id: tour.tour_manager_id,
        category: 'administrative',
        priority: 'medium',
        due_date: this.calculateDueDate(tour.start_date, -45), // 45 days before tour start
        metadata: {
          tour_id: tour.id,
          task_type: 'tour_budget',
          auto_generated: true,
          budget_amount: tour.budget
        }
      });
    }

    // Create tasks for each base task
    for (const taskData of baseTasks) {
      try {
        await taskService.createTask(taskData);
      } catch (error) {
        console.error(`Failed to create task: ${taskData.title}`, error);
      }
    }
  }

  /**
   * Create tasks when a new tour stop is added
   */
  async createTourStopTasks(tourStop: TourStop, tour: Tour): Promise<void> {
    try {
      const stopTasks: CreateTaskRequest[] = [
        {
          title: `Confirm venue details for ${tourStop.venue_name}`,
          description: `Verify venue capacity, technical requirements, and contact information for the show at ${tourStop.venue_name} in ${tourStop.venue_city}.`,
          creator_id: tour.tour_manager_id,
          assignee_id: tour.tour_manager_id,
          category: 'logistics',
          priority: 'high',
          due_date: this.calculateDueDate(tourStop.event_date, -30), // 30 days before show
          metadata: {
            tour_id: tour.id,
            tour_stop_id: tourStop.id,
            task_type: 'venue_confirmation',
            auto_generated: true,
            venue_name: tourStop.venue_name,
            venue_city: tourStop.venue_city
          }
        },
        {
          title: `Local marketing for ${tourStop.venue_city} show`,
          description: `Execute local marketing campaign for the show at ${tourStop.venue_name}. Include local radio, social media, and venue promotion.`,
          creator_id: tour.tour_manager_id,
          assignee_id: tour.tour_manager_id,
          category: 'marketing',
          priority: 'medium',
          due_date: this.calculateDueDate(tourStop.event_date, -21), // 3 weeks before show
          metadata: {
            tour_id: tour.id,
            tour_stop_id: tourStop.id,
            task_type: 'local_marketing',
            auto_generated: true,
            venue_name: tourStop.venue_name,
            venue_city: tourStop.venue_city
          }
        },
        {
          title: `Technical setup for ${tourStop.venue_name}`,
          description: `Coordinate sound check, lighting, and technical requirements for the show. Confirm equipment and crew availability.`,
          creator_id: tour.tour_manager_id,
          assignee_id: tour.tour_manager_id,
          category: 'technical',
          priority: 'high',
          due_date: this.calculateDueDate(tourStop.event_date, -7), // 1 week before show
          metadata: {
            tour_id: tour.id,
            tour_stop_id: tourStop.id,
            task_type: 'technical_setup',
            auto_generated: true,
            venue_name: tourStop.venue_name
          }
        }
      ];

      // Add accommodation task if it's an out-of-town show
      if (tourStop.venue_city.toLowerCase() !== 'sydney') { // Assuming Sydney is home base
        stopTasks.push({
          title: `Book accommodation for ${tourStop.venue_city}`,
          description: `Arrange accommodation for all tour participants for the ${tourStop.venue_city} show on ${new Date(tourStop.event_date).toLocaleDateString()}.`,
          creator_id: tour.tour_manager_id,
          assignee_id: tour.tour_manager_id,
          category: 'travel',
          priority: 'high',
          due_date: this.calculateDueDate(tourStop.event_date, -14), // 2 weeks before show
          metadata: {
            tour_id: tour.id,
            tour_stop_id: tourStop.id,
            task_type: 'accommodation',
            auto_generated: true,
            venue_city: tourStop.venue_city
          }
        });
      }

      // Create all stop-related tasks
      for (const taskData of stopTasks) {
        try {
          await taskService.createTask(taskData);
        } catch (error) {
          console.error(`Failed to create tour stop task: ${taskData.title}`, error);
        }
      }
    } catch (error) {
      console.error('Failed to create tour stop tasks:', error);
    }
  }

  /**
   * Create collaboration-specific tasks
   */
  async createCollaborationTasks(collaboration: TourCollaboration, tour: Tour): Promise<void> {
    try {
      const collaborationTasks: CreateTaskRequest[] = [
        {
          title: `Setup collaboration agreement with ${collaboration.collaborator_id}`,
          description: `Finalize collaboration terms, revenue sharing, and responsibilities with the ${collaboration.role}.`,
          creator_id: tour.tour_manager_id,
          assignee_id: tour.tour_manager_id,
          category: 'administrative',
          priority: 'high',
          due_date: this.calculateDueDate(tour.start_date, -45), // 45 days before tour
          metadata: {
            tour_id: tour.id,
            collaboration_id: collaboration.id,
            task_type: 'collaboration_agreement',
            auto_generated: true,
            collaborator_role: collaboration.role
          }
        },
        {
          title: `Coordinate marketing with ${collaboration.role}`,
          description: `Align marketing efforts and share promotional materials with the collaborative partner.`,
          creator_id: tour.tour_manager_id,
          assignee_id: tour.tour_manager_id,
          category: 'marketing',
          priority: 'medium',
          due_date: this.calculateDueDate(tour.start_date, -30), // 30 days before tour
          metadata: {
            tour_id: tour.id,
            collaboration_id: collaboration.id,
            task_type: 'collaboration_marketing',
            auto_generated: true,
            collaborator_role: collaboration.role
          }
        }
      ];

      // Add specific tasks based on collaboration role
      if (collaboration.role === 'local_promoter') {
        collaborationTasks.push({
          title: `Get local insights from ${collaboration.role}`,
          description: `Collect local market knowledge, venue recommendations, and audience insights from the local promoter.`,
          creator_id: tour.tour_manager_id,
          assignee_id: tour.tour_manager_id,
          category: 'event_planning',
          priority: 'medium',
          due_date: this.calculateDueDate(tour.start_date, -60), // 60 days before tour
          metadata: {
            tour_id: tour.id,
            collaboration_id: collaboration.id,
            task_type: 'local_insights',
            auto_generated: true
          }
        });
      }

      if (collaboration.role === 'sponsor') {
        collaborationTasks.push({
          title: `Coordinate sponsor requirements`,
          description: `Confirm sponsor branding requirements, promotional materials, and activation opportunities.`,
          creator_id: tour.tour_manager_id,
          assignee_id: tour.tour_manager_id,
          category: 'marketing',
          priority: 'high',
          due_date: this.calculateDueDate(tour.start_date, -35), // 35 days before tour
          metadata: {
            tour_id: tour.id,
            collaboration_id: collaboration.id,
            task_type: 'sponsor_coordination',
            auto_generated: true
          }
        });
      }

      // Create all collaboration tasks
      for (const taskData of collaborationTasks) {
        try {
          await taskService.createTask(taskData);
        } catch (error) {
          console.error(`Failed to create collaboration task: ${taskData.title}`, error);
        }
      }
    } catch (error) {
      console.error('Failed to create collaboration tasks:', error);
    }
  }

  /**
   * Create post-tour tasks for follow-up and analysis
   */
  async createPostTourTasks(tour: Tour): Promise<void> {
    try {
      const postTourTasks: CreateTaskRequest[] = [
        {
          title: `Post-tour analysis for ${tour.name}`,
          description: `Analyze tour performance, collect feedback, and document lessons learned from the ${tour.name} tour.`,
          creator_id: tour.tour_manager_id,
          assignee_id: tour.tour_manager_id,
          category: 'analytics',
          priority: 'medium',
          due_date: this.calculateDueDate(tour.end_date, 7), // 1 week after tour ends
          metadata: {
            tour_id: tour.id,
            task_type: 'post_tour_analysis',
            auto_generated: true
          }
        },
        {
          title: `Financial reconciliation for ${tour.name}`,
          description: `Complete financial reconciliation, process final payments, and prepare tour profitability report.`,
          creator_id: tour.tour_manager_id,
          assignee_id: tour.tour_manager_id,
          category: 'administrative',
          priority: 'high',
          due_date: this.calculateDueDate(tour.end_date, 14), // 2 weeks after tour ends
          metadata: {
            tour_id: tour.id,
            task_type: 'financial_reconciliation',
            auto_generated: true
          }
        },
        {
          title: `Thank you communications for ${tour.name}`,
          description: `Send thank you messages to venues, collaborators, crew, and key supporters of the tour.`,
          creator_id: tour.tour_manager_id,
          assignee_id: tour.tour_manager_id,
          category: 'communications',
          priority: 'low',
          due_date: this.calculateDueDate(tour.end_date, 3), // 3 days after tour ends
          metadata: {
            tour_id: tour.id,
            task_type: 'thank_you_communications',
            auto_generated: true
          }
        }
      ];

      // Create all post-tour tasks
      for (const taskData of postTourTasks) {
        try {
          await taskService.createTask(taskData);
        } catch (error) {
          console.error(`Failed to create post-tour task: ${taskData.title}`, error);
        }
      }
    } catch (error) {
      console.error('Failed to create post-tour tasks:', error);
    }
  }

  // =====================================
  // TASK STATUS AUTOMATION
  // =====================================

  /**
   * Update task statuses based on tour progress
   */
  async updateTaskStatusesForTourProgress(tour: Tour): Promise<void> {
    try {
      // Get all tasks related to this tour
      const allTasks = await taskService.getTasks({
        filters: {
          metadata_contains: { tour_id: tour.id }
        }
      });

      for (const task of allTasks.tasks) {
        // Auto-complete certain tasks when tour status changes
        if (tour.status === 'completed' && task.metadata?.task_type === 'tour_setup') {
          if (task.status === 'pending' || task.status === 'in_progress') {
            await taskService.updateTask(task.id, {
              status: 'completed',
              completed_at: new Date().toISOString()
            });
          }
        }

        // Auto-complete venue confirmation tasks when tour stops are confirmed
        if (task.metadata?.task_type === 'venue_confirmation' && task.metadata?.tour_stop_id) {
          const tourStops = await tourService.getTourStops(tour.id);
          const relatedStop = tourStops.find(stop => stop.id === task.metadata?.tour_stop_id);
          
          if (relatedStop?.status === 'confirmed' && task.status === 'pending') {
            await taskService.updateTask(task.id, {
              status: 'completed',
              completed_at: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to update task statuses for tour progress:', error);
    }
  }

  /**
   * Create reminder tasks for upcoming deadlines
   */
  async createReminderTasks(tour: Tour): Promise<void> {
    try {
      const now = new Date();
      const tourStart = tour.start_date ? new Date(tour.start_date) : null;
      
      if (!tourStart || tourStart <= now) return;

      const daysUntilTour = Math.ceil((tourStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Create reminder tasks at specific intervals
      const reminderIntervals = [30, 14, 7, 3, 1]; // Days before tour

      for (const interval of reminderIntervals) {
        if (daysUntilTour <= interval && daysUntilTour > (interval - 1)) {
          const reminderTask: CreateTaskRequest = {
            title: `${interval}-day reminder: ${tour.name} tour preparation`,
            description: `Review and finalize all preparations for the ${tour.name} tour starting in ${interval} day${interval === 1 ? '' : 's'}.`,
            creator_id: tour.tour_manager_id,
            assignee_id: tour.tour_manager_id,
            category: 'reminder',
            priority: interval <= 7 ? 'urgent' : 'high',
            due_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Due tomorrow
            metadata: {
              tour_id: tour.id,
              task_type: 'tour_reminder',
              auto_generated: true,
              reminder_interval: interval
            }
          };

          await taskService.createTask(reminderTask);
        }
      }
    } catch (error) {
      console.error('Failed to create reminder tasks:', error);
    }
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  /**
   * Calculate due date relative to a base date
   */
  private calculateDueDate(baseDate: string | null, offsetDays: number): string {
    if (!baseDate) {
      // If no base date, use offset from now
      return new Date(Date.now() + Math.abs(offsetDays) * 24 * 60 * 60 * 1000).toISOString();
    }

    const base = new Date(baseDate);
    return new Date(base.getTime() + offsetDays * 24 * 60 * 60 * 1000).toISOString();
  }

  /**
   * Get tour-related tasks with enhanced metadata
   */
  async getTourTasks(tourId: string): Promise<any[]> {
    try {
      const tasksResponse = await taskService.getTasks({
        filters: {
          metadata_contains: { tour_id: tourId }
        },
        sort_by: 'due_date',
        sort_order: 'asc'
      });

      return tasksResponse.tasks.map(task => ({
        ...task,
        tour_context: {
          is_tour_task: true,
          task_type: task.metadata?.task_type || 'general',
          tour_stop_id: task.metadata?.tour_stop_id,
          collaboration_id: task.metadata?.collaboration_id,
          auto_generated: task.metadata?.auto_generated || false
        }
      }));
    } catch (error) {
      console.error('Failed to get tour tasks:', error);
      return [];
    }
  }

  /**
   * Create custom task template for specific tour types
   */
  async createTourTypeTemplate(tourType: string, templateData: Partial<TaskTemplate>): Promise<void> {
    try {
      const template: Partial<TaskTemplate> = {
        name: `${tourType} Tour Setup`,
        description: `Standard task template for ${tourType} tours`,
        category: 'event_planning',
        is_system_template: true,
        variables: ['tour_name', 'tour_start_date', 'tour_manager', 'budget'],
        ...templateData
      };

      await taskService.createTaskTemplate(template as TaskTemplate);
    } catch (error) {
      console.error('Failed to create tour type template:', error);
    }
  }

  /**
   * Bulk update tasks based on tour changes
   */
  async handleTourUpdate(tour: Tour, changes: Partial<Tour>): Promise<void> {
    try {
      // Update task due dates if tour dates changed
      if (changes.start_date || changes.end_date) {
        await this.updateTaskDueDates(tour);
      }

      // Update task assignees if tour manager changed
      if (changes.tour_manager_id) {
        await this.updateTaskAssignees(tour, changes.tour_manager_id);
      }

      // Update task statuses based on tour status
      await this.updateTaskStatusesForTourProgress(tour);

      // Create new reminder tasks if needed
      await this.createReminderTasks(tour);
    } catch (error) {
      console.error('Failed to handle tour update:', error);
    }
  }

  /**
   * Update task due dates when tour dates change
   */
  private async updateTaskDueDates(tour: Tour): Promise<void> {
    try {
      const tourTasks = await this.getTourTasks(tour.id);
      
      for (const task of tourTasks) {
        if (task.tour_context?.auto_generated && task.metadata?.due_offset_days) {
          const offsetDays = task.metadata.due_offset_days;
          let newDueDate: string;

          if (task.metadata?.tour_stop_id) {
            // Task is related to a specific tour stop
            const tourStops = await tourService.getTourStops(tour.id);
            const relatedStop = tourStops.find(stop => stop.id === task.metadata.tour_stop_id);
            newDueDate = this.calculateDueDate(relatedStop?.event_date || null, offsetDays);
          } else {
            // Task is related to the tour overall
            newDueDate = this.calculateDueDate(tour.start_date, offsetDays);
          }

          await taskService.updateTask(task.id, { due_date: newDueDate });
        }
      }
    } catch (error) {
      console.error('Failed to update task due dates:', error);
    }
  }

  /**
   * Update task assignees when tour manager changes
   */
  private async updateTaskAssignees(tour: Tour, newManagerId: string): Promise<void> {
    try {
      const tourTasks = await this.getTourTasks(tour.id);
      
      for (const task of tourTasks) {
        if (task.tour_context?.auto_generated && task.assignee_id === tour.tour_manager_id) {
          await taskService.updateTask(task.id, { assignee_id: newManagerId });
        }
      }
    } catch (error) {
      console.error('Failed to update task assignees:', error);
    }
  }
}

export const tourTaskIntegrationService = new TourTaskIntegrationService();