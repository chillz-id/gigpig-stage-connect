
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CustomizationData } from '@/types/customization';

interface TypographyTabProps {
  settings: CustomizationData;
  updateSettings: (section: keyof CustomizationData, key: string, value: any) => void;
}

const TypographyTab: React.FC<TypographyTabProps> = ({ settings, updateSettings }) => {
  return (
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
  );
};

export default TypographyTab;
