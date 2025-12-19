import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  tasks: {
    title: string;
    priority: "low" | "medium" | "high";
  }[];
}

interface TaskTemplateLibraryProps {
  onSelectTemplate?: (template: TaskTemplate) => void;
}

const templates: TaskTemplate[] = [
  {
    id: "event-planning",
    title: "Comedy Event Planning",
    description: "Complete checklist for organizing a comedy show",
    category: "Events",
    tasks: [
      { title: "Book venue", priority: "high" },
      { title: "Confirm comedians", priority: "high" },
      { title: "Set up ticket sales", priority: "high" },
      { title: "Create event page", priority: "medium" },
      { title: "Promote on social media", priority: "medium" },
      { title: "Arrange sound equipment", priority: "medium" },
      { title: "Prepare runsheet", priority: "low" },
    ],
  },
  {
    id: "comedian-onboarding",
    title: "Comedian Onboarding",
    description: "Tasks for welcoming new comedians to the platform",
    category: "Onboarding",
    tasks: [
      { title: "Welcome email sent", priority: "high" },
      { title: "Profile review completed", priority: "high" },
      { title: "Payment details verified", priority: "medium" },
      { title: "First gig booked", priority: "medium" },
      { title: "Feedback survey sent", priority: "low" },
    ],
  },
  {
    id: "marketing-campaign",
    title: "Marketing Campaign",
    description: "Launch a new marketing initiative",
    category: "Marketing",
    tasks: [
      { title: "Define campaign goals", priority: "high" },
      { title: "Create content calendar", priority: "high" },
      { title: "Design graphics", priority: "medium" },
      { title: "Schedule social posts", priority: "medium" },
      { title: "Track engagement metrics", priority: "low" },
    ],
  },
];

export default function TaskTemplateLibrary({ onSelectTemplate }: TaskTemplateLibraryProps) {
  const handleSelectTemplate = (template: TaskTemplate) => {
    toast.success(`Applied "${template.title}" template`);
    onSelectTemplate?.(template);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Task Templates</h2>
        <p className="text-muted-foreground">
          Pre-built task lists to help you get started quickly
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="p-5">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {template.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Includes {template.tasks.length} tasks:
                </p>
                <ul className="space-y-1">
                  {template.tasks.slice(0, 3).map((task, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      {task.title}
                    </li>
                  ))}
                  {template.tasks.length > 3 && (
                    <li className="text-xs text-muted-foreground">
                      +{template.tasks.length - 3} more tasks
                    </li>
                  )}
                </ul>
              </div>

              <Button
                onClick={() => handleSelectTemplate(template)}
                className="professional-button w-full gap-2"
              >
                Use Template
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No templates available yet</p>
        </Card>
      )}
    </div>
  );
}
