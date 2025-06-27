
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Type, Layout, RefreshCw } from 'lucide-react';
import { useCustomizationData } from '@/hooks/useCustomizationData';
import { useThemeOperations } from '@/hooks/useThemeOperations';
import ColorsTab from '@/components/customization/ColorsTab';
import TypographyTab from '@/components/customization/TypographyTab';
import ComponentsTab from '@/components/customization/ComponentsTab';
import LayoutTab from '@/components/customization/LayoutTab';
import LivePreview from '@/components/customization/LivePreview';
import ActionsPanel from '@/components/customization/ActionsPanel';
import SavedThemes from '@/components/customization/SavedThemes';

const CustomizationSettings = () => {
  const { user, hasRole } = useAuth();
  const {
    settings,
    savedThemes,
    isLoading,
    updateSettings,
    resetToDefault,
    loadSettings,
    loadSavedThemes
  } = useCustomizationData();

  const {
    themeName,
    setThemeName,
    themeDescription,
    setThemeDescription,
    isSaving,
    saveTheme,
    loadTheme,
    applyTheme
  } = useThemeOperations(settings, loadSettings, loadSavedThemes);

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

  const handleLoadTheme = async (themeId: string) => {
    const themeData = await loadTheme(themeId);
    if (themeData) {
      // Update the current settings with the loaded theme data
      Object.keys(themeData).forEach(section => {
        Object.keys(themeData[section as keyof typeof themeData]).forEach(key => {
          updateSettings(
            section as keyof typeof themeData,
            key,
            themeData[section as keyof typeof themeData][key as keyof typeof themeData[typeof section]]
          );
        });
      });
    }
  };

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

              <TabsContent value="colors">
                <ColorsTab settings={settings} updateSettings={updateSettings} />
              </TabsContent>

              <TabsContent value="typography">
                <TypographyTab settings={settings} updateSettings={updateSettings} />
              </TabsContent>

              <TabsContent value="components">
                <ComponentsTab settings={settings} updateSettings={updateSettings} />
              </TabsContent>

              <TabsContent value="layout">
                <LayoutTab settings={settings} updateSettings={updateSettings} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview and Actions Panel */}
          <div className="space-y-6">
            <LivePreview settings={settings} />
            <ActionsPanel
              themeName={themeName}
              setThemeName={setThemeName}
              themeDescription={themeDescription}
              setThemeDescription={setThemeDescription}
              saveTheme={saveTheme}
              resetToDefault={resetToDefault}
              isSaving={isSaving}
            />
            <SavedThemes
              savedThemes={savedThemes}
              loadTheme={handleLoadTheme}
              applyTheme={applyTheme}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationSettings;
