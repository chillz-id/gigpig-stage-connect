import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/AuthContext';
import { InvoiceTemplate, InvoiceTemplateConfig, DEFAULT_TEMPLATES } from '@/types/invoiceTemplate';
import { TemplateGallery } from './TemplateGallery';
import { TemplateCustomizer } from './TemplateCustomizer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface TemplateManagerProps {
  onSelectTemplate: (config: InvoiceTemplateConfig) => void;
  previewComponent?: (config: InvoiceTemplateConfig) => React.ReactNode;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  onSelectTemplate,
  previewComponent,
}) => {
  const { user } = useUser();
  const [templates, setTemplates] = useState<InvoiceTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [currentConfig, setCurrentConfig] = useState<InvoiceTemplateConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'modern' as const,
    layout: 'standard' as const,
  });

  // Load user's saved templates
  const loadUserTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const userTemplates = data.map(t => ({
          ...t,
          brandingOptions: t.branding_options,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));
        setTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load custom templates');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadUserTemplates();
    } else {
      setIsLoading(false);
    }
  }, [loadUserTemplates, user]);

  const handleSelectTemplate = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    const config: InvoiceTemplateConfig = {
      template,
      branding: template.brandingOptions,
      customizations: {
        showLineNumbers: true,
        showItemCodes: false,
        showDiscounts: false,
        showTaxBreakdown: true,
        showPaymentTerms: true,
        showNotes: true,
        currency: 'AUD',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'standard',
      },
    };
    setCurrentConfig(config);
    onSelectTemplate(config);
  };

  const handleConfigChange = (config: InvoiceTemplateConfig) => {
    setCurrentConfig(config);
    onSelectTemplate(config);
  };

  const handleSaveTemplate = async (config: InvoiceTemplateConfig) => {
    if (!user || !selectedTemplate) return;

    try {
      const templateData = {
        user_id: user.id,
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        category: selectedTemplate.category,
        layout: selectedTemplate.layout,
        branding_options: config.branding,
        is_default: false,
      };

      if (selectedTemplate.id.startsWith('custom-')) {
        // Update existing custom template
        const { error } = await supabase
          .from('invoice_templates')
          .update(templateData)
          .eq('id', selectedTemplate.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        // Create new custom template based on default
        const { data, error } = await supabase
          .from('invoice_templates')
          .insert({
            ...templateData,
            name: `${selectedTemplate.name} (Custom)`,
          })
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          const newTemplate: InvoiceTemplate = {
            ...data,
            brandingOptions: data.branding_options,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          setTemplates(prev => [...prev, newTemplate]);
          setSelectedTemplate(newTemplate);
          toast.success('Custom template created');
        }
      }
      
      await loadUserTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleCreateTemplate = async () => {
    if (!user || !newTemplate.name) return;

    try {
      const { data, error } = await supabase
        .from('invoice_templates')
        .insert({
          user_id: user.id,
          name: newTemplate.name,
          description: newTemplate.description,
          category: newTemplate.category,
          layout: newTemplate.layout,
          branding_options: DEFAULT_TEMPLATES[0].brandingOptions,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await loadUserTemplates();
        setShowCreateDialog(false);
        setNewTemplate({
          name: '',
          description: '',
          category: 'modern',
          layout: 'standard',
        });
        toast.success('Template created successfully');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('invoice_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Template deleted');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleExportTemplate = (template: InvoiceTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Template exported');
  };

  const handleImportTemplate = async (file: File) => {
    try {
      const text = await file.text();
      const template = JSON.parse(text) as InvoiceTemplate;
      
      if (!user) {
        toast.error('Please sign in to import templates');
        return;
      }

      // Save imported template
      const { data, error } = await supabase
        .from('invoice_templates')
        .insert({
          user_id: user.id,
          name: `${template.name} (Imported)`,
          description: template.description,
          category: template.category,
          layout: template.layout,
          branding_options: template.brandingOptions,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;

      await loadUserTemplates();
      toast.success('Template imported successfully');
    } catch (error) {
      console.error('Error importing template:', error);
      toast.error('Failed to import template');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showCustomizer && currentConfig ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Customize Template</h2>
            <Button
              variant="outline"
              onClick={() => setShowCustomizer(false)}
            >
              Back to Gallery
            </Button>
          </div>
          
          <TemplateCustomizer
            config={currentConfig}
            onConfigChange={handleConfigChange}
            onSave={user ? handleSaveTemplate : undefined}
            onExport={() => selectedTemplate && handleExportTemplate(selectedTemplate)}
            onImport={user ? handleImportTemplate : undefined}
            preview={previewComponent && previewComponent(currentConfig)}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Invoice Templates</h2>
            {selectedTemplate && (
              <Button onClick={() => setShowCustomizer(true)}>
                Customize Template
              </Button>
            )}
          </div>

          <TemplateGallery
            templates={templates}
            selectedTemplateId={selectedTemplate?.id}
            onSelectTemplate={handleSelectTemplate}
            onEditTemplate={(template) => {
              handleSelectTemplate(template);
              setShowCustomizer(true);
            }}
            onDeleteTemplate={user ? handleDeleteTemplate : undefined}
            onDuplicateTemplate={user ? (template) => {
              setSelectedTemplate(template);
              setShowCreateDialog(true);
            } : undefined}
            onCreateTemplate={user ? () => setShowCreateDialog(true) : undefined}
            onImportTemplate={user ? handleImportTemplate : undefined}
            onExportTemplate={handleExportTemplate}
          />
        </>
      )}

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Custom Template"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your template..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={!newTemplate.name}>
                Create Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
