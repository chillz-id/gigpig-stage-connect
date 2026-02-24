/**
 * AutomationSettings Component
 * Configure automation rules: triggers, platforms, scheduling strategy.
 */

import { useState } from 'react';
import {
  Plus,
  Trash2,
  Zap,
  Calendar,
  Clock,
  Settings2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useAutomationRules,
  useCreateRule,
  useToggleRule,
  useDeleteRule,
} from '@/hooks/social/useAutomationRules';
import { useToast } from '@/hooks/use-toast';

const TRIGGER_TYPES = [
  { value: 'event_created', label: 'Event Created', description: 'When a new event is published' },
  { value: 'lineup_changed', label: 'Lineup Changed', description: 'When an event lineup is updated' },
  { value: 'ticket_milestone', label: 'Ticket Milestone', description: 'When ticket sales hit 50%, 75%, 90%, or sold out' },
] as const;

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'threads', label: 'Threads' },
  { id: 'bluesky', label: 'Bluesky' },
] as const;

const STRATEGIES = [
  { value: 'best_time', label: 'Best Time', description: 'Use Metricool optimal posting times' },
  { value: 'immediate', label: 'Immediate', description: 'Post as soon as approved' },
  { value: 'custom', label: 'Custom', description: 'Set a custom schedule' },
] as const;

interface AutomationSettingsProps {
  organizationId: string | undefined;
}

export function AutomationSettings({ organizationId }: AutomationSettingsProps) {
  const { toast } = useToast();
  const { data: rules, isLoading, error } = useAutomationRules(organizationId);
  const createMutation = useCreateRule();
  const toggleMutation = useToggleRule();
  const deleteMutation = useDeleteRule();

  const [showForm, setShowForm] = useState(false);
  const [newTrigger, setNewTrigger] = useState<string>('event_created');
  const [newPlatforms, setNewPlatforms] = useState<string[]>(['instagram', 'facebook']);
  const [newStrategy, setNewStrategy] = useState<string>('best_time');
  const [newPrompt, setNewPrompt] = useState('');

  const handlePlatformToggle = (platform: string) => {
    setNewPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  const handleCreate = () => {
    if (!organizationId) return;
    if (newPlatforms.length === 0) {
      toast({ title: 'Select at least one platform', variant: 'destructive' });
      return;
    }

    createMutation.mutate(
      {
        organization_id: organizationId,
        trigger_type: newTrigger,
        platforms: newPlatforms,
        is_active: true,
        scheduling_strategy: newStrategy as 'best_time' | 'immediate' | 'custom',
        template_prompt: newPrompt || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: 'Automation rule created' });
          setShowForm(false);
          setNewTrigger('event_created');
          setNewPlatforms(['instagram', 'facebook']);
          setNewStrategy('best_time');
          setNewPrompt('');
        },
        onError: (err) => {
          toast({
            title: 'Failed to create rule',
            description: err instanceof Error ? err.message : 'Please try again',
            variant: 'destructive',
          });
        },
      },
    );
  };

  const handleToggle = (id: string, currentState: boolean) => {
    toggleMutation.mutate({ id, isActive: !currentState });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: 'Rule deleted' }),
    });
  };

  if (!organizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Automation Settings</CardTitle>
          <CardDescription>Select an organization to configure automation rules.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automation Rules
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure triggers that automatically queue content for generation.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* New rule form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Automation Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trigger type */}
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select value={newTrigger} onValueChange={setNewTrigger}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div>
                        <span>{t.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{t.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Platforms */}
            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(({ id, label }) => (
                  <div
                    key={id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      newPlatforms.includes(id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handlePlatformToggle(id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handlePlatformToggle(id)}
                  >
                    <Checkbox
                      checked={newPlatforms.includes(id)}
                      onCheckedChange={() => handlePlatformToggle(id)}
                    />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduling strategy */}
            <div className="space-y-2">
              <Label>Scheduling Strategy</Label>
              <Select value={newStrategy} onValueChange={setNewStrategy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <div>
                        <span>{s.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{s.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom prompt */}
            <div className="space-y-2">
              <Label>Custom AI Prompt (Optional)</Label>
              <Textarea
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Override the default content generation prompt for this trigger..."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the default prompt for this trigger type.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Create Rule
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing rules */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load automation rules. {error instanceof Error ? error.message : ''}
          </AlertDescription>
        </Alert>
      ) : !rules || rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Settings2 className="h-10 w-10 mb-3" />
            <p className="font-medium">No automation rules configured</p>
            <p className="text-sm mt-1">
              Add a rule to automatically queue content when events change.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const trigger = TRIGGER_TYPES.find((t) => t.value === rule.trigger_type);
            const strategy = STRATEGIES.find((s) => s.value === rule.scheduling_strategy);

            return (
              <Card key={rule.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => handleToggle(rule.id, rule.is_active)}
                          disabled={toggleMutation.isPending}
                        />
                        <span className={`font-medium ${rule.is_active ? '' : 'text-muted-foreground'}`}>
                          {trigger?.label ?? rule.trigger_type}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {rule.platforms.map((p) => (
                          <Badge key={p} variant="secondary" className="text-xs capitalize">
                            {p}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {strategy?.value === 'best_time' ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <Calendar className="h-3 w-3" />
                          )}
                          {strategy?.label ?? rule.scheduling_strategy}
                        </span>
                        {rule.template_prompt && (
                          <span className="truncate max-w-48" title={rule.template_prompt}>
                            Custom prompt
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
