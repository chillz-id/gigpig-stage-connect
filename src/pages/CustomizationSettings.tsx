
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Palette, Type, Layout, Eye, Save, Download, Upload, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomizationData {
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    background: string;
    cardBackground: string;
    headerBackground: string;
    textPrimary: string;
    textSecondary: string;
    textLink: string;
    border: string;
    accent: string;
  };
  typography: {
    headingSize: number;
    bodySize: number;
    smallSize: number;
    headingWeight: number;
    bodyWeight: number;
  };
  components: {
    buttonRadius: number;
    cardRadius: number;
    inputRadius: number;
    profilePictureShape: 'circle' | 'square';
    profilePictureSize: number;
  };
  layout: {
    containerMaxWidth: number;
    pageMargin: number;
    componentSpacing: number;
  };
  icons: {
    size: number;
    color: string;
  };
}

const CustomizationSettings = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<CustomizationData | null>(null);
  const [savedThemes, setSavedThemes] = useState<any[]>([]);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Block access for non-admins
  if (!user || !hasRole('admin')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Palette className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
            <p className="text-muted-foreground">Only administrators can access customization settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    loadSettings();
    loadSavedThemes();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('customization_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Properly type cast the Json data to CustomizationData
        setSettings(data.settings_data as unknown as CustomizationData);
      } else {
        // Load default settings
        setSettings({
          colors: {
            primary: '#3b82f6',
            secondary: '#64748b',
            tertiary: '#8b5cf6',
            background: '#ffffff',
            cardBackground: '#f8fafc',
            headerBackground: '#1e293b',
            textPrimary: '#0f172a',
            textSecondary: '#64748b',
            textLink: '#3b82f6',
            border: '#e2e8f0',
            accent: '#10b981'
          },
          typography: {
            headingSize: 24,
            bodySize: 16,
            smallSize: 14,
            headingWeight: 600,
            bodyWeight: 400
          },
          components: {
            buttonRadius: 6,
            cardRadius: 8,
            inputRadius: 6,
            profilePictureShape: 'circle',
            profilePictureSize: 80
          },
          layout: {
            containerMaxWidth: 1200,
            pageMargin: 16,
            componentSpacing: 16
          },
          icons: {
            size: 20,
            color: '#64748b'
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load customization settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('customization_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedThemes(data || []);
    } catch (error) {
      console.error('Error loading saved themes:', error);
    }
  };

  const updateSettings = (section: keyof CustomizationData, key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value
      }
    }));
  };

  const saveTheme = async () => {
    if (!settings || !themeName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a theme name",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('customization_settings')
        .insert({
          name: themeName,
          description: themeDescription,
          settings_data: settings as any, // Cast to any for Json compatibility
          is_active: false,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Theme saved successfully"
      });
      
      setThemeName('');
      setThemeDescription('');
      loadSavedThemes();
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: "Error",
        description: "Failed to save theme",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadTheme = async (themeId: string) => {
    try {
      const { data, error } = await supabase
        .from('customization_settings')
        .select('*')
        .eq('id', themeId)
        .single();

      if (error) throw error;
      // Properly type cast the Json data to CustomizationData
      setSettings(data.settings_data as unknown as CustomizationData);
      
      toast({
        title: "Success",
        description: "Theme loaded successfully"
      });
    } catch (error) {
      console.error('Error loading theme:', error);
      toast({
        title: "Error",
        description: "Failed to load theme",
        variant: "destructive"
      });
    }
  };

  const applyTheme = async (themeId: string) => {
    try {
      // First, deactivate all themes
      await supabase
        .from('customization_settings')
        .update({ is_active: false })
        .neq('id', '');

      // Then activate the selected theme
      const { error } = await supabase
        .from('customization_settings')
        .update({ is_active: true })
        .eq('id', themeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Theme applied successfully"
      });
      
      loadSettings();
      loadSavedThemes();
    } catch (error) {
      console.error('Error applying theme:', error);
      toast({
        title: "Error",
        description: "Failed to apply theme",
        variant: "destructive"
      });
    }
  };

  const resetToDefault = () => {
    setSettings({
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        tertiary: '#8b5cf6',
        background: '#ffffff',
        cardBackground: '#f8fafc',
        headerBackground: '#1e293b',
        textPrimary: '#0f172a',
        textSecondary: '#64748b',
        textLink: '#3b82f6',
        border: '#e2e8f0',
        accent: '#10b981'
      },
      typography: {
        headingSize: 24,
        bodySize: 16,
        smallSize: 14,
        headingWeight: 600,
        bodyWeight: 400
      },
      components: {
        buttonRadius: 6,
        cardRadius: 8,
        inputRadius: 6,
        profilePictureShape: 'circle',
        profilePictureSize: 80
      },
      layout: {
        containerMaxWidth: 1200,
        pageMargin: 16,
        componentSpacing: 16
      },
      icons: {
        size: 20,
        color: '#64748b'
      }
    });
  };

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading customization settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Website Customization</h1>
          <p className="text-muted-foreground">Customize the visual appearance of Stand Up Sydney</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="colors" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="colors" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="typography" className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Typography
                </TabsTrigger>
                <TabsTrigger value="components" className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Components
                </TabsTrigger>
                <TabsTrigger value="layout" className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Layout
                </TabsTrigger>
              </TabsList>

              {/* Colors Tab */}
              <TabsContent value="colors">
                <Card>
                  <CardHeader>
                    <CardTitle>Color Scheme</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(settings.colors).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={value}
                              onChange={(e) => updateSettings('colors', key, e.target.value)}
                              className="w-12 h-10 p-1 border rounded"
                            />
                            <Input
                              type="text"
                              value={value}
                              onChange={(e) => updateSettings('colors', key, e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Typography Tab */}
              <TabsContent value="typography">
                <Card>
                  <CardHeader>
                    <CardTitle>Typography Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Heading Size: {settings.typography.headingSize}px</Label>
                        <Slider
                          value={[settings.typography.headingSize]}
                          onValueChange={([value]) => updateSettings('typography', 'headingSize', value)}
                          min={16}
                          max={48}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Body Size: {settings.typography.bodySize}px</Label>
                        <Slider
                          value={[settings.typography.bodySize]}
                          onValueChange={([value]) => updateSettings('typography', 'bodySize', value)}
                          min={12}
                          max={24}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Small Size: {settings.typography.smallSize}px</Label>
                        <Slider
                          value={[settings.typography.smallSize]}
                          onValueChange={([value]) => updateSettings('typography', 'smallSize', value)}
                          min={10}
                          max={18}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Heading Weight: {settings.typography.headingWeight}</Label>
                        <Slider
                          value={[settings.typography.headingWeight]}
                          onValueChange={([value]) => updateSettings('typography', 'headingWeight', value)}
                          min={300}
                          max={900}
                          step={100}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Body Weight: {settings.typography.bodyWeight}</Label>
                        <Slider
                          value={[settings.typography.bodyWeight]}
                          onValueChange={([value]) => updateSettings('typography', 'bodyWeight', value)}
                          min={300}
                          max={700}
                          step={100}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Components Tab */}
              <TabsContent value="components">
                <Card>
                  <CardHeader>
                    <CardTitle>Component Styling</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Button Radius: {settings.components.buttonRadius}px</Label>
                        <Slider
                          value={[settings.components.buttonRadius]}
                          onValueChange={([value]) => updateSettings('components', 'buttonRadius', value)}
                          min={0}
                          max={20}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Card Radius: {settings.components.cardRadius}px</Label>
                        <Slider
                          value={[settings.components.cardRadius]}
                          onValueChange={([value]) => updateSettings('components', 'cardRadius', value)}
                          min={0}
                          max={20}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Input Radius: {settings.components.inputRadius}px</Label>
                        <Slider
                          value={[settings.components.inputRadius]}
                          onValueChange={([value]) => updateSettings('components', 'inputRadius', value)}
                          min={0}
                          max={20}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Profile Picture Shape</Label>
                        <Select
                          value={settings.components.profilePictureShape}
                          onValueChange={(value: 'circle' | 'square') => updateSettings('components', 'profilePictureShape', value)}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="circle">Circle</SelectItem>
                            <SelectItem value="square">Square</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Profile Picture Size: {settings.components.profilePictureSize}px</Label>
                        <Slider
                          value={[settings.components.profilePictureSize]}
                          onValueChange={([value]) => updateSettings('components', 'profilePictureSize', value)}
                          min={40}
                          max={200}
                          step={10}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Layout Tab */}
              <TabsContent value="layout">
                <Card>
                  <CardHeader>
                    <CardTitle>Layout & Spacing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Container Max Width: {settings.layout.containerMaxWidth}px</Label>
                        <Slider
                          value={[settings.layout.containerMaxWidth]}
                          onValueChange={([value]) => updateSettings('layout', 'containerMaxWidth', value)}
                          min={800}
                          max={1600}
                          step={50}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Page Margin: {settings.layout.pageMargin}px</Label>
                        <Slider
                          value={[settings.layout.pageMargin]}
                          onValueChange={([value]) => updateSettings('layout', 'pageMargin', value)}
                          min={8}
                          max={48}
                          step={4}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Component Spacing: {settings.layout.componentSpacing}px</Label>
                        <Slider
                          value={[settings.layout.componentSpacing]}
                          onValueChange={([value]) => updateSettings('layout', 'componentSpacing', value)}
                          min={8}
                          max={48}
                          step={4}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Icon Size: {settings.icons.size}px</Label>
                        <Slider
                          value={[settings.icons.size]}
                          onValueChange={([value]) => updateSettings('icons', 'size', value)}
                          min={12}
                          max={32}
                          step={2}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Icon Color</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="color"
                            value={settings.icons.color}
                            onChange={(e) => updateSettings('icons', 'color', e.target.value)}
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            type="text"
                            value={settings.icons.color}
                            onChange={(e) => updateSettings('icons', 'color', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview and Actions Panel */}
          <div className="space-y-6">
            {/* Live Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: settings.colors.cardBackground,
                    borderColor: settings.colors.border,
                    borderRadius: `${settings.components.cardRadius}px`
                  }}
                >
                  <h3 
                    style={{
                      color: settings.colors.textPrimary,
                      fontSize: `${settings.typography.headingSize}px`,
                      fontWeight: settings.typography.headingWeight,
                      marginBottom: `${settings.layout.componentSpacing}px`
                    }}
                  >
                    Sample Heading
                  </h3>
                  <p 
                    style={{
                      color: settings.colors.textSecondary,
                      fontSize: `${settings.typography.bodySize}px`,
                      fontWeight: settings.typography.bodyWeight,
                      marginBottom: `${settings.layout.componentSpacing}px`
                    }}
                  >
                    This is sample body text to preview your typography settings.
                  </p>
                  <button 
                    style={{
                      backgroundColor: settings.colors.primary,
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: `${settings.components.buttonRadius}px`,
                      border: 'none',
                      cursor: 'pointer',
                      marginRight: `${settings.layout.componentSpacing}px`
                    }}
                  >
                    Primary Button
                  </button>
                  <div 
                    style={{
                      width: `${settings.components.profilePictureSize}px`,
                      height: `${settings.components.profilePictureSize}px`,
                      backgroundColor: settings.colors.secondary,
                      borderRadius: settings.components.profilePictureShape === 'circle' ? '50%' : `${settings.components.cardRadius}px`,
                      marginTop: `${settings.layout.componentSpacing}px`
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme Name</Label>
                  <Input
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    placeholder="Enter theme name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={themeDescription}
                    onChange={(e) => setThemeDescription(e.target.value)}
                    placeholder="Describe this theme"
                    rows={2}
                  />
                </div>
                <Button 
                  onClick={saveTheme} 
                  disabled={isSaving || !themeName.trim()}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Theme'}
                </Button>
                <Button 
                  onClick={resetToDefault} 
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
              </CardContent>
            </Card>

            {/* Saved Themes */}
            <Card>
              <CardHeader>
                <CardTitle>Saved Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {savedThemes.map((theme) => (
                    <div key={theme.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{theme.name}</h4>
                          {theme.description && (
                            <p className="text-sm text-muted-foreground">{theme.description}</p>
                          )}
                        </div>
                        {theme.is_active && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadTheme(theme.id)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Load
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => applyTheme(theme.id)}
                          disabled={theme.is_active}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationSettings;
