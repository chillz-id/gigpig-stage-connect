import React, { useState, useCallback } from 'react';
import { BrandingOptions, InvoiceTemplateConfig } from '@/types/invoiceTemplate';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { Palette, Type, Layout, Settings, Download, Upload, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateCustomizerProps {
  config: InvoiceTemplateConfig;
  onConfigChange: (config: InvoiceTemplateConfig) => void;
  onSave?: (config: InvoiceTemplateConfig) => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
  preview?: React.ReactNode;
}

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  config,
  onConfigChange,
  onSave,
  onExport,
  onImport,
  preview,
}) => {
  const [activeTab, setActiveTab] = useState('colors');
  const [showPreview, setShowPreview] = useState(true);

  const handleBrandingChange = useCallback((key: keyof BrandingOptions, value: any) => {
    onConfigChange({
      ...config,
      branding: {
        ...config.branding,
        [key]: value,
      },
    });
  }, [config, onConfigChange]);

  const handleColorChange = useCallback((colorKey: keyof BrandingOptions['colors'], value: string) => {
    handleBrandingChange('colors', {
      ...config.branding.colors,
      [colorKey]: value,
    });
  }, [config.branding.colors, handleBrandingChange]);

  const handleFontChange = useCallback((fontKey: keyof BrandingOptions['fonts'], value: string) => {
    handleBrandingChange('fonts', {
      ...config.branding.fonts,
      [fontKey]: value,
    });
  }, [config.branding.fonts, handleBrandingChange]);

  const handleCustomizationChange = useCallback((key: string, value: any) => {
    onConfigChange({
      ...config,
      customizations: {
        ...config.customizations,
        [key]: value,
      },
    });
  }, [config, onConfigChange]);

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onImport) {
        onImport(file);
      }
    };
    input.click();
  };

  const handleSave = () => {
    if (onSave) {
      onSave(config);
      toast.success('Template customization saved');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Customization Panel */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Template Customization</span>
            <div className="flex items-center gap-2">
              <Button
                className="professional-button"
                size="sm"
                onClick={handleImportClick}
                disabled={!onImport}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button
                className="professional-button"
                size="sm"
                onClick={onExport}
                disabled={!onExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {onSave && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="colors" className="flex items-center gap-1">
                <Palette className="h-4 w-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="fonts" className="flex items-center gap-1">
                <Type className="h-4 w-4" />
                Fonts
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-1">
                <Layout className="h-4 w-4" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={config.branding.colors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.branding.colors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      placeholder="#7C3AED"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={config.branding.colors.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.branding.colors.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      placeholder="#A855F7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={config.branding.colors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.branding.colors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      placeholder="#C084FC"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={config.branding.colors.text}
                      onChange={(e) => handleColorChange('text', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.branding.colors.text}
                      onChange={(e) => handleColorChange('text', e.target.value)}
                      placeholder="#1F2937"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={config.branding.colors.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.branding.colors.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={config.branding.colors.border}
                      onChange={(e) => handleColorChange('border', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.branding.colors.border}
                      onChange={(e) => handleColorChange('border', e.target.value)}
                      placeholder="#E5E7EB"
                    />
                  </div>
                </div>
              </div>

              {/* Header Colors */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Header Colors</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <Input
                      type="text"
                      value={config.branding.header.backgroundColor}
                      onChange={(e) => handleBrandingChange('header', {
                        ...config.branding.header,
                        backgroundColor: e.target.value,
                      })}
                      placeholder="Color or gradient"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={config.branding.header.textColor}
                        onChange={(e) => handleBrandingChange('header', {
                          ...config.branding.header,
                          textColor: e.target.value,
                        })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={config.branding.header.textColor}
                        onChange={(e) => handleBrandingChange('header', {
                          ...config.branding.header,
                          textColor: e.target.value,
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fonts" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Select
                    value={config.branding.fonts.heading}
                    onValueChange={(value) => handleFontChange('heading', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                      <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                      <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                      <SelectItem value="Georgia, serif">Georgia</SelectItem>
                      <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                      <SelectItem value="Courier New, monospace">Courier New</SelectItem>
                      <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                      <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <Select
                    value={config.branding.fonts.body}
                    onValueChange={(value) => handleFontChange('body', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                      <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                      <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                      <SelectItem value="Georgia, serif">Georgia</SelectItem>
                      <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                      <SelectItem value="Courier New, monospace">Courier New</SelectItem>
                      <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                      <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Accent Font</Label>
                  <Select
                    value={config.branding.fonts.accent}
                    onValueChange={(value) => handleFontChange('accent', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                      <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                      <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                      <SelectItem value="Georgia, serif">Georgia</SelectItem>
                      <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                      <SelectItem value="Courier New, monospace">Courier New</SelectItem>
                      <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                      <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Page Size</Label>
                  <Select
                    value={config.branding.layout.pageSize}
                    onValueChange={(value) => handleBrandingChange('layout', {
                      ...config.branding.layout,
                      pageSize: value as 'A4' | 'Letter' | 'Legal',
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <Select
                    value={config.branding.layout.orientation}
                    onValueChange={(value) => handleBrandingChange('layout', {
                      ...config.branding.layout,
                      orientation: value as 'portrait' | 'landscape',
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Margins (mm)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Top</Label>
                      <Input
                        type="number"
                        value={config.branding.layout.marginTop}
                        onChange={(e) => handleBrandingChange('layout', {
                          ...config.branding.layout,
                          marginTop: parseInt(e.target.value) || 0,
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bottom</Label>
                      <Input
                        type="number"
                        value={config.branding.layout.marginBottom}
                        onChange={(e) => handleBrandingChange('layout', {
                          ...config.branding.layout,
                          marginBottom: parseInt(e.target.value) || 0,
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Left</Label>
                      <Input
                        type="number"
                        value={config.branding.layout.marginLeft}
                        onChange={(e) => handleBrandingChange('layout', {
                          ...config.branding.layout,
                          marginLeft: parseInt(e.target.value) || 0,
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Right</Label>
                      <Input
                        type="number"
                        value={config.branding.layout.marginRight}
                        onChange={(e) => handleBrandingChange('layout', {
                          ...config.branding.layout,
                          marginRight: parseInt(e.target.value) || 0,
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Show Line Numbers</Label>
                  <Switch
                    checked={config.customizations.showLineNumbers}
                    onCheckedChange={(checked) => handleCustomizationChange('showLineNumbers', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show Tax Breakdown</Label>
                  <Switch
                    checked={config.customizations.showTaxBreakdown}
                    onCheckedChange={(checked) => handleCustomizationChange('showTaxBreakdown', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show Payment Terms</Label>
                  <Switch
                    checked={config.customizations.showPaymentTerms}
                    onCheckedChange={(checked) => handleCustomizationChange('showPaymentTerms', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show Notes</Label>
                  <Switch
                    checked={config.customizations.showNotes}
                    onCheckedChange={(checked) => handleCustomizationChange('showNotes', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={config.customizations.currency}
                    onValueChange={(value) => handleCustomizationChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="NZD">NZD - New Zealand Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select
                    value={config.customizations.dateFormat}
                    onValueChange={(value) => handleCustomizationChange('dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Footer Text</Label>
                  <Input
                    type="text"
                    value={config.branding.footer.text}
                    onChange={(e) => handleBrandingChange('footer', {
                      ...config.branding.footer,
                      text: e.target.value,
                    })}
                    placeholder="Thank you for your business"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      {preview && (
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Template Preview</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'}
              </Button>
            </CardTitle>
          </CardHeader>
          {showPreview && (
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[800px]">
                {preview}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};