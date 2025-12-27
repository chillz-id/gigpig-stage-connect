import { type Dispatch, type SetStateAction } from 'react';
import { Settings, Trash2, Plus } from 'lucide-react';
import { type UseFormReturn } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import type { CreateTemplateFormData, TemplateVariableType, TemplateVariable } from '@/types/task';
import { VARIABLE_TYPES } from './schema';

interface TemplateVariablesPanelProps {
  form: UseFormReturn<CreateTemplateFormData>;
  variableDialogOpen: boolean;
  onDialogChange: (open: boolean) => void;
  variableForm: { key: string; variable: TemplateVariable };
  setVariableForm: Dispatch<SetStateAction<{ key: string; variable: TemplateVariable }>>;
  onSaveVariable: () => void;
  onEditVariable: (key: string) => void;
  onDeleteVariable: (key: string) => void;
  editingVariable: string | null;
}

export function TemplateVariablesPanel({
  form,
  variableDialogOpen,
  onDialogChange,
  variableForm,
  setVariableForm,
  onSaveVariable,
  onEditVariable,
  onDeleteVariable,
  editingVariable
}: TemplateVariablesPanelProps) {
  const variables = form.watch('variables');
  const hasVariables = Object.keys(variables).length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Template Variables</CardTitle>
        <Dialog open={variableDialogOpen} onOpenChange={onDialogChange}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Variable
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingVariable ? 'Edit Variable' : 'Add Variable'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Variable Key</Label>
                <Input
                  value={variableForm.key}
                  onChange={(event) => setVariableForm({
                    key: event.target.value,
                    variable: variableForm.variable
                  })}
                  placeholder="e.g., venue_name, event_date"
                  disabled={!!editingVariable}
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={variableForm.variable.type}
                  onValueChange={(value) => setVariableForm((prev) => ({
                    ...prev,
                    variable: { ...prev.variable, type: value as TemplateVariableType }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VARIABLE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={variableForm.variable.label}
                  onChange={(event) => setVariableForm((prev) => ({
                    ...prev,
                    variable: { ...prev.variable, label: event.target.value }
                  }))}
                  placeholder="Display name for this variable"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={variableForm.variable.description || ''}
                  onChange={(event) => setVariableForm((prev) => ({
                    ...prev,
                    variable: { ...prev.variable, description: event.target.value }
                  }))}
                  placeholder="Optional description..."
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={variableForm.variable.required || false}
                  onCheckedChange={(checked) => setVariableForm((prev) => ({
                    ...prev,
                    variable: { ...prev.variable, required: checked }
                  }))}
                />
                <Label>Required</Label>
              </div>

              {variableForm.variable.type === 'select' && (
                <div className="space-y-2">
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={(variableForm.variable.options || []).join('\n')}
                    onChange={(event) => setVariableForm((prev) => ({
                      ...prev,
                      variable: {
                        ...prev.variable,
                        options: event.target.value.split('\n').filter(Boolean)
                      }
                    }))}
                    placeholder={`Option 1\nOption 2\nOption 3`}
                    rows={4}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button className="professional-button" onClick={() => onDialogChange(false)}>
                  Cancel
                </Button>
                <Button onClick={onSaveVariable}>
                  {editingVariable ? 'Update' : 'Add'} Variable
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!hasVariables ? (
          <p className="text-gray-500 text-center py-8">
            No variables defined. Variables allow you to create reusable templates with placeholders.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(variables).map(([key, variable]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{`{${key}}`}</div>
                  <div className="text-sm text-gray-600">{variable.label}</div>
                  {variable.description && (
                    <div className="text-xs text-gray-500">{variable.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="professional-button">{variable.type}</Badge>
                  {variable.required && <Badge variant="default">Required</Badge>}
                  <Button variant="ghost" size="sm" onClick={() => onEditVariable(key)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteVariable(key)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
