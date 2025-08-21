import React, { useState } from 'react';
import { InvoiceTemplate, TEMPLATE_CATEGORIES, DEFAULT_TEMPLATES } from '@/types/invoiceTemplate';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Download, 
  Upload, 
  Star,
  Copy,
  Trash2,
  CheckCircle 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TemplateGalleryProps {
  templates: InvoiceTemplate[];
  selectedTemplateId?: string;
  onSelectTemplate: (template: InvoiceTemplate) => void;
  onEditTemplate?: (template: InvoiceTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onDuplicateTemplate?: (template: InvoiceTemplate) => void;
  onCreateTemplate?: () => void;
  onImportTemplate?: (file: File) => void;
  onExportTemplate?: (template: InvoiceTemplate) => void;
  showActions?: boolean;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  onCreateTemplate,
  onImportTemplate,
  onExportTemplate,
  showActions = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate | null>(null);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onImportTemplate) {
        onImportTemplate(file);
        toast.success('Template imported successfully');
      }
    };
    input.click();
  };

  const TemplateCard = ({ template }: { template: InvoiceTemplate }) => {
    const isSelected = selectedTemplateId === template.id;

    return (
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={() => onSelectTemplate(template)}
      >
        {isSelected && (
          <div className="absolute top-2 right-2 z-10">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
        )}

        {template.isDefault && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Default
            </Badge>
          </div>
        )}

        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{template.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </CardHeader>

        <CardContent className="pb-4">
          {/* Template Preview Thumbnail */}
          <div 
            className="w-full h-48 bg-gray-100 rounded-md overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${template.brandingOptions.colors.primary}20, ${template.brandingOptions.colors.secondary}20)`,
            }}
          >
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: template.brandingOptions.colors.primary }}
                />
                <div className="flex-1">
                  <div className="h-2 bg-gray-300 rounded w-1/3 mb-1"></div>
                  <div className="h-1 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              
              <div className="space-y-1 pt-4">
                <div className="h-1 bg-gray-200 rounded"></div>
                <div className="h-1 bg-gray-200 rounded w-5/6"></div>
                <div className="h-1 bg-gray-200 rounded w-4/6"></div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div 
                  className="h-8 rounded"
                  style={{ backgroundColor: template.brandingOptions.colors.primary + '40' }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {template.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {template.layout}
            </Badge>
          </div>
        </CardContent>

        {showActions && (
          <CardFooter className="pt-0 gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewTemplate(template);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {onEditTemplate && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTemplate(template);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {onDuplicateTemplate && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateTemplate(template);
                  toast.success('Template duplicated');
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}

            {onExportTemplate && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onExportTemplate(template);
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}

            {onDeleteTemplate && !template.isDefault && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this template?')) {
                    onDeleteTemplate(template.id);
                    toast.success('Template deleted');
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onImportTemplate && (
            <Button variant="outline" onClick={handleImportClick}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          )}
          {onCreateTemplate && (
            <Button onClick={onCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          {TEMPLATE_CATEGORIES.map(category => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {filteredTemplates.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mx-auto max-w-sm space-y-3">
                <Search className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">No templates found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery 
                    ? "Try adjusting your search query" 
                    : "Create your first template to get started"}
                </p>
                {onCreateTemplate && !searchQuery && (
                  <Button onClick={onCreateTemplate} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name} - Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="bg-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-4" style={{ 
                  color: previewTemplate?.brandingOptions.colors.primary 
                }}>
                  Invoice Preview
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  This is a preview of how your invoices will look with this template.
                </p>
                
                {/* Mock invoice content */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">From</h3>
                      <p className="text-sm">Stand Up Sydney</p>
                      <p className="text-sm text-muted-foreground">info@standupsydney.com</p>
                    </div>
                    <div className="text-right">
                      <h3 className="font-semibold mb-2">Invoice #INV-2024-001</h3>
                      <p className="text-sm text-muted-foreground">Date: 01/02/2024</p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Description</th>
                          <th className="text-right py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">Comedy Performance</td>
                          <td className="text-right py-2">$500.00</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="py-2 font-semibold">Total</td>
                          <td className="text-right py-2 font-semibold" style={{ 
                            color: previewTemplate?.brandingOptions.colors.primary 
                          }}>
                            $500.00
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};