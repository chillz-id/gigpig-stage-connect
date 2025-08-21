-- Advanced Task Management System for Stand Up Sydney
-- Creates comprehensive task management with templates, reminders, and collaboration

-- Create ENUM types for task management
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_category AS ENUM ('event_planning', 'artist_management', 'marketing', 'travel', 'logistics', 'financial', 'administrative', 'creative');
CREATE TYPE reminder_type AS ENUM ('due_date', 'custom', 'recurring');

-- Main tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status task_status DEFAULT 'pending',
    priority task_priority DEFAULT 'medium',
    due_date TIMESTAMPTZ,
    estimated_hours INTEGER,
    actual_hours INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    category task_category DEFAULT 'administrative',
    metadata JSONB DEFAULT '{}',
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    template_id UUID, -- Will reference task_templates table
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB, -- For recurring tasks
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Task comments table for collaboration
CREATE TABLE public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]', -- Array of file references
    is_system_comment BOOLEAN DEFAULT FALSE, -- For automated system comments
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Task reminders for notifications
CREATE TABLE public.task_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    reminder_type reminder_type NOT NULL,
    remind_at TIMESTAMPTZ NOT NULL,
    message TEXT,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    recurring_interval INTERVAL, -- For recurring reminders
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Task templates for reusable workflows
CREATE TABLE public.task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category task_category DEFAULT 'administrative',
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    is_system_template BOOLEAN DEFAULT FALSE, -- For built-in templates
    variables JSONB DEFAULT '{}', -- Template variables like {venue_name}, {event_date}
    tags TEXT[] DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Task template items - individual tasks within templates
CREATE TABLE public.task_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.task_templates(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL, -- Can contain variables like "Confirm {venue_name} booking"
    description TEXT,
    priority task_priority DEFAULT 'medium',
    estimated_hours INTEGER,
    due_offset_days INTEGER, -- Days from template application date
    category task_category DEFAULT 'administrative',
    order_index INTEGER NOT NULL, -- Order within template
    dependencies UUID[] DEFAULT '{}', -- Other template item IDs that must complete first
    metadata JSONB DEFAULT '{}', -- Additional template-specific data
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_template_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks they created or are assigned to" ON public.tasks FOR SELECT TO authenticated 
USING (
    auth.uid() = creator_id OR 
    auth.uid() = assignee_id OR
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update tasks they created or are assigned to" ON public.tasks FOR UPDATE TO authenticated 
USING (
    auth.uid() = creator_id OR 
    auth.uid() = assignee_id OR
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can delete tasks they created" ON public.tasks FOR DELETE TO authenticated 
USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for task comments
CREATE POLICY "Users can view comments on tasks they have access to" ON public.task_comments FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.tasks t 
        WHERE t.id = task_id AND (
            t.creator_id = auth.uid() OR 
            t.assignee_id = auth.uid() OR
            public.has_role(auth.uid(), 'admin')
        )
    )
);

CREATE POLICY "Users can create comments on accessible tasks" ON public.task_comments FOR INSERT TO authenticated 
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.tasks t 
        WHERE t.id = task_id AND (
            t.creator_id = auth.uid() OR 
            t.assignee_id = auth.uid() OR
            public.has_role(auth.uid(), 'admin')
        )
    )
);

CREATE POLICY "Users can update their own comments" ON public.task_comments FOR UPDATE TO authenticated 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for task reminders
CREATE POLICY "Users can view reminders for their tasks" ON public.task_reminders FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.tasks t 
        WHERE t.id = task_id AND (
            t.creator_id = auth.uid() OR 
            t.assignee_id = auth.uid() OR
            public.has_role(auth.uid(), 'admin')
        )
    )
);

CREATE POLICY "Users can create reminders for their tasks" ON public.task_reminders FOR INSERT TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tasks t 
        WHERE t.id = task_id AND (
            t.creator_id = auth.uid() OR 
            t.assignee_id = auth.uid() OR
            public.has_role(auth.uid(), 'admin')
        )
    )
);

-- RLS Policies for task templates
CREATE POLICY "Users can view public templates or their own templates" ON public.task_templates FOR SELECT TO authenticated 
USING (is_public = TRUE OR creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own templates" ON public.task_templates FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own templates" ON public.task_templates FOR UPDATE TO authenticated 
USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for task template items
CREATE POLICY "Users can view template items for accessible templates" ON public.task_template_items FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.task_templates tt 
        WHERE tt.id = template_id AND (
            tt.is_public = TRUE OR 
            tt.creator_id = auth.uid() OR
            public.has_role(auth.uid(), 'admin')
        )
    )
);

CREATE POLICY "Users can create template items for their templates" ON public.task_template_items FOR INSERT TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.task_templates tt 
        WHERE tt.id = template_id AND (
            tt.creator_id = auth.uid() OR
            public.has_role(auth.uid(), 'admin')
        )
    )
);

-- Create indexes for performance
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_creator_id ON public.tasks(creator_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_category ON public.tasks(category);
CREATE INDEX idx_tasks_template_id ON public.tasks(template_id);
CREATE INDEX idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX idx_tasks_tags ON public.tasks USING gin(tags);

CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON public.task_comments(user_id);
CREATE INDEX idx_task_comments_created_at ON public.task_comments(created_at);

CREATE INDEX idx_task_reminders_task_id ON public.task_reminders(task_id);
CREATE INDEX idx_task_reminders_remind_at ON public.task_reminders(remind_at);
CREATE INDEX idx_task_reminders_sent ON public.task_reminders(sent);

CREATE INDEX idx_task_templates_creator_id ON public.task_templates(creator_id);
CREATE INDEX idx_task_templates_is_public ON public.task_templates(is_public);
CREATE INDEX idx_task_templates_category ON public.task_templates(category);

CREATE INDEX idx_task_template_items_template_id ON public.task_template_items(template_id);
CREATE INDEX idx_task_template_items_order_index ON public.task_template_items(order_index);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON public.task_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-complete parent task when all subtasks are completed
CREATE OR REPLACE FUNCTION check_parent_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if this task has a parent and was just completed
    IF NEW.parent_task_id IS NOT NULL AND NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Check if all subtasks of the parent are now completed
        IF NOT EXISTS (
            SELECT 1 FROM public.tasks 
            WHERE parent_task_id = NEW.parent_task_id 
            AND status != 'completed'
        ) THEN
            -- Update parent task to completed
            UPDATE public.tasks 
            SET status = 'completed', completed_at = now(), progress_percentage = 100
            WHERE id = NEW.parent_task_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_complete_parent_task AFTER UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION check_parent_task_completion();

-- Function to update completed_at timestamp when task is marked as completed
CREATE OR REPLACE FUNCTION update_task_completion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Set completed_at when status changes to completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        NEW.completed_at = now();
        NEW.progress_percentage = 100;
    END IF;
    
    -- Clear completed_at when status changes from completed to something else
    IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_completion BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_task_completion_timestamp();

-- Function to automatically create task reminders
CREATE OR REPLACE FUNCTION create_automatic_task_reminders()
RETURNS TRIGGER AS $$
BEGIN
    -- Create due date reminder (1 day before due date)
    IF NEW.due_date IS NOT NULL THEN
        INSERT INTO public.task_reminders (task_id, reminder_type, remind_at, message)
        VALUES (
            NEW.id,
            'due_date',
            NEW.due_date - INTERVAL '1 day',
            'Task "' || NEW.title || '" is due tomorrow'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_task_reminders AFTER INSERT ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION create_automatic_task_reminders();

-- Insert system task templates
INSERT INTO public.task_templates (name, description, category, creator_id, is_public, is_system_template, variables) VALUES
('New Tour Setup', 'Complete checklist for setting up a new comedy tour', 'event_planning', (SELECT id FROM auth.users LIMIT 1), TRUE, TRUE, '{"tour_name": "text", "start_date": "date", "end_date": "date", "tour_manager": "text"}'),
('Event Planning Checklist', 'Standard checklist for planning a comedy event', 'event_planning', (SELECT id FROM auth.users LIMIT 1), TRUE, TRUE, '{"event_name": "text", "event_date": "date", "venue_name": "text", "event_manager": "text"}'),
('Artist Onboarding', 'Checklist for onboarding new comedians to the platform', 'artist_management', (SELECT id FROM auth.users LIMIT 1), TRUE, TRUE, '{"artist_name": "text", "agent_name": "text", "contract_date": "date"}'),
('Venue Booking Process', 'Standard process for booking and confirming venues', 'logistics', (SELECT id FROM auth.users LIMIT 1), TRUE, TRUE, '{"venue_name": "text", "booking_date": "date", "event_date": "date", "capacity": "number"}'),
('Marketing Campaign Launch', 'Comprehensive marketing campaign setup and execution', 'marketing', (SELECT id FROM auth.users LIMIT 1), TRUE, TRUE, '{"campaign_name": "text", "launch_date": "date", "budget": "number", "target_audience": "text"}');

-- Insert template items for "New Tour Setup" template
INSERT INTO public.task_template_items (template_id, title, description, priority, due_offset_days, category, order_index) VALUES
((SELECT id FROM public.task_templates WHERE name = 'New Tour Setup'), 'Finalize tour dates and cities', 'Confirm all tour stops and dates with venues', 'high', -60, 'event_planning', 1),
((SELECT id FROM public.task_templates WHERE name = 'New Tour Setup'), 'Book transportation for {tour_name}', 'Arrange flights, buses, or other transport between cities', 'high', -45, 'logistics', 2),
((SELECT id FROM public.task_templates WHERE name = 'New Tour Setup'), 'Secure accommodation bookings', 'Book hotels or other accommodation for all tour dates', 'high', -30, 'logistics', 3),
((SELECT id FROM public.task_templates WHERE name = 'New Tour Setup'), 'Create marketing materials for {tour_name}', 'Design posters, social media assets, and promotional content', 'medium', -21, 'marketing', 4),
((SELECT id FROM public.task_templates WHERE name = 'New Tour Setup'), 'Coordinate technical requirements', 'Confirm sound, lighting, and technical needs with venues', 'medium', -14, 'logistics', 5),
((SELECT id FROM public.task_templates WHERE name = 'New Tour Setup'), 'Launch ticket sales', 'Begin selling tickets across all platforms', 'high', -10, 'marketing', 6),
((SELECT id FROM public.task_templates WHERE name = 'New Tour Setup'), 'Final logistics check', 'Confirm all arrangements 48 hours before tour start', 'urgent', -2, 'logistics', 7);

-- Insert template items for "Event Planning Checklist" template
INSERT INTO public.task_template_items (template_id, title, description, priority, due_offset_days, category, order_index) VALUES
((SELECT id FROM public.task_templates WHERE name = 'Event Planning Checklist'), 'Confirm venue booking for {venue_name}', 'Final confirmation of venue availability and requirements', 'high', -14, 'logistics', 1),
((SELECT id FROM public.task_templates WHERE name = 'Event Planning Checklist'), 'Schedule sound check at {venue_name}', 'Coordinate technical rehearsal with performers', 'medium', -7, 'logistics', 2),
((SELECT id FROM public.task_templates WHERE name = 'Event Planning Checklist'), 'Arrange catering for {event_name}', 'Organize food and beverages for performers and crew', 'medium', -3, 'logistics', 3),
((SELECT id FROM public.task_templates WHERE name = 'Event Planning Checklist'), 'Security briefing and setup', 'Coordinate with venue security and review safety protocols', 'high', -1, 'administrative', 4),
((SELECT id FROM public.task_templates WHERE name = 'Event Planning Checklist'), 'Final performer confirmations', 'Confirm all comedians and their requirements', 'urgent', -1, 'artist_management', 5);

-- Insert template items for "Artist Onboarding" template
INSERT INTO public.task_template_items (template_id, title, description, priority, due_offset_days, category, order_index) VALUES
((SELECT id FROM public.task_templates WHERE name = 'Artist Onboarding'), 'Welcome {artist_name} to the platform', 'Send welcome package and platform introduction', 'medium', 0, 'administrative', 1),
((SELECT id FROM public.task_templates WHERE name = 'Artist Onboarding'), 'Collect professional photos from {artist_name}', 'Request high-quality promotional photos for profile', 'medium', 3, 'marketing', 2),
((SELECT id FROM public.task_templates WHERE name = 'Artist Onboarding'), 'Setup social media profiles for {artist_name}', 'Create or optimize social media presence', 'low', 7, 'marketing', 3),
((SELECT id FROM public.task_templates WHERE name = 'Artist Onboarding'), 'Schedule first performance opportunity', 'Find suitable event for debut performance', 'high', 14, 'artist_management', 4),
((SELECT id FROM public.task_templates WHERE name = 'Artist Onboarding'), 'Contract finalization with {agent_name}', 'Complete all legal documentation and agreements', 'high', 5, 'administrative', 5);

-- Grant necessary permissions
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.task_comments TO authenticated;
GRANT ALL ON public.task_reminders TO authenticated;
GRANT ALL ON public.task_templates TO authenticated;
GRANT ALL ON public.task_template_items TO authenticated;

-- Add foreign key constraint for template_id (had to add after template table creation)
ALTER TABLE public.tasks ADD CONSTRAINT fk_tasks_template_id 
    FOREIGN KEY (template_id) REFERENCES public.task_templates(id) ON DELETE SET NULL;