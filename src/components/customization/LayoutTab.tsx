
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CustomizationData } from '@/types/customization';

interface LayoutTabProps {
  settings: CustomizationData;
  updateSettings: (section: keyof CustomizationData, key: string, value: any) => void;
}

const LayoutTab: React.FC<LayoutTabProps> = ({ settings, updateSettings }) => {
  return (
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
  );
};

export default LayoutTab;
