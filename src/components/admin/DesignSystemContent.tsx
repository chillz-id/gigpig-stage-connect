
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Sliders, Type, Layout, Sparkles } from 'lucide-react';
import ColorSystemControls from './design-system/ColorSystemControls';
import ButtonDesignControls from './design-system/ButtonDesignControls';
import LivePreviewPanel from './design-system/LivePreviewPanel';
import PresetManagement from './design-system/PresetManagement';
import { useDesignSystem } from '@/hooks/useDesignSystem';

const DesignSystemContent = () => {
  const { settings, updateSetting, saveSettings, resetToDefault, isLoading } = useDesignSystem();
  const [activeTab, setActiveTab] = useState('colors');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading design system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Controls Panel */}
      <div className="xl:col-span-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="buttons" className="flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Buttons
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="effects" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Effects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors">
            <ColorSystemControls settings={settings} updateSetting={updateSetting} />
          </TabsContent>

          <TabsContent value="buttons">
            <ButtonDesignControls settings={settings} updateSetting={updateSetting} />
          </TabsContent>

          <TabsContent value="typography">
            <Card>
              <CardHeader>
                <CardTitle>Typography Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Typography controls coming in Phase 2...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layout">
            <Card>
              <CardHeader>
                <CardTitle>Layout & Spacing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Layout controls coming in Phase 3...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="effects">
            <Card>
              <CardHeader>
                <CardTitle>Visual Effects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Visual effects coming in Phase 3...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Side Panel */}
      <div className="space-y-6">
        <LivePreviewPanel settings={settings} />
        <PresetManagement 
          settings={settings}
          onSave={saveSettings}
          onReset={resetToDefault}
        />
      </div>
    </div>
  );
};

export default DesignSystemContent;
