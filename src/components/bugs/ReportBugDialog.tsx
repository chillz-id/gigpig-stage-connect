import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateBug } from '@/hooks/useBugTracker';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface ReportBugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', icon: '⚪', description: 'Minor issue with workaround' },
  { value: 'medium', label: 'Medium', icon: '🟡', description: 'Noticeable issue, impacts some users' },
  { value: 'high', label: 'High', icon: '🟠', description: 'Major issue affecting many users' },
  { value: 'critical', label: 'Critical', icon: '🔴', description: 'System down or data loss' },
];

const CATEGORY_OPTIONS = [
  { value: 'ui', label: 'UI', description: 'Visual or layout issues' },
  { value: 'functionality', label: 'Functionality', description: 'Feature not working as expected' },
  { value: 'performance', label: 'Performance', description: 'Slow loading or responsiveness' },
  { value: 'security', label: 'Security', description: 'Security vulnerabilities' },
  { value: 'data', label: 'Data', description: 'Data accuracy or integrity issues' },
];

const bugSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  steps_to_reproduce: z.string().max(1000, 'Steps must be less than 1000 characters').optional(),
  expected_behavior: z.string().max(500, 'Expected behavior must be less than 500 characters').optional(),
  actual_behavior: z.string().max(500, 'Actual behavior must be less than 500 characters').optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['ui', 'functionality', 'performance', 'security', 'data']).optional(),
});

type BugFormData = z.infer<typeof bugSchema>;

export function ReportBugDialog({ open, onOpenChange }: ReportBugDialogProps) {
  const createBugMutation = useCreateBug();

  const form = useForm<BugFormData>({
    resolver: zodResolver(bugSchema),
    defaultValues: {
      title: '',
      description: '',
      steps_to_reproduce: '',
      expected_behavior: '',
      actual_behavior: '',
      severity: 'medium',
      category: undefined,
    },
  });

  const onSubmit = async (data: BugFormData) => {
    try {
      await createBugMutation.mutateAsync({
        title: data.title,
        description: data.description,
        steps_to_reproduce: data.steps_to_reproduce || undefined,
        expected_behavior: data.expected_behavior || undefined,
        actual_behavior: data.actual_behavior || undefined,
        severity: data.severity,
        category: data.category,
      });

      toast.success('Bug report submitted successfully');
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast.error('Failed to submit bug report');
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting bugs you encounter. Please provide as much detail as possible.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the bug" {...field} />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/100 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of what went wrong"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/1000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Steps to Reproduce */}
            <FormField
              control={form.control}
              name="steps_to_reproduce"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steps to Reproduce</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Step-by-step instructions to reproduce the bug
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expected vs Actual Behavior */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="expected_behavior"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Behavior</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What should happen"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actual_behavior"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Behavior</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What actually happens"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Severity and Category */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SEVERITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <span>{option.icon}</span>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Optional: Categorize the bug</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={createBugMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createBugMutation.isPending}>
                {createBugMutation.isPending ? 'Submitting...' : 'Submit Bug Report'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
