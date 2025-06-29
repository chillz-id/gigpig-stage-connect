
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomizationData } from '@/types/customization';

interface ComponentsTabProps {
  settings: CustomizationData;
  updateSettings: (section: keyof CustomizationData, key: string, value: any) => void;
}

const ComponentsTab: React.FC<ComponentsTabProps> = ({ settings, updateSettings }) => {
  return (
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
  );
};

export default ComponentsTab;
