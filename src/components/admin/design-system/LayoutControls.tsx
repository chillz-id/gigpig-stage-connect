
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Layout, RotateCcw } from 'lucide-react';
import { DesignSystemSettings } from '@/types/designSystem';

interface LayoutControlsProps {
  settings: DesignSystemSettings;
  updateSetting: (category: string, setting: string, value: any) => void;
}

const LayoutControls: React.FC<LayoutControlsProps> = ({ settings, updateSetting }) => {
  const handleSliderChange = (setting: string, value: number[]) => {
    updateSetting('layout', setting, value[0]);
  };

  const resetLayout = () => {
    updateSetting('layout', 'containerMaxWidth', 1200);
    updateSetting('layout', 'sectionPadding', 24);
    updateSetting('layout', 'cardSpacing', 16);
    updateSetting('layout', 'gridGap', 24);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5" />
              Layout & Spacing
            </CardTitle>
            <Button variant="outline" size="sm" onClick={resetLayout}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Container Max Width: {settings.layout.containerMaxWidth}px</Label>
              <Slider
                value={[settings.layout.containerMaxWidth]}
                onValueChange={(value) => handleSliderChange('containerMaxWidth', value)}
                min={800}
                max={1600}
                step={50}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Section Padding: {settings.layout.sectionPadding}px</Label>
              <Slider
                value={[settings.layout.sectionPadding]}
                onValueChange={(value) => handleSliderChange('sectionPadding', value)}
                min={8}
                max={64}
                step={4}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Card Spacing: {settings.layout.cardSpacing}px</Label>
              <Slider
                value={[settings.layout.cardSpacing]}
                onValueChange={(value) => handleSliderChange('cardSpacing', value)}
                min={8}
                max={48}
                step={4}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Grid Gap: {settings.layout.gridGap}px</Label>
              <Slider
                value={[settings.layout.gridGap]}
                onValueChange={(value) => handleSliderChange('gridGap', value)}
                min={8}
                max={48}
                step={4}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Layout Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded-lg p-4 space-y-4"
            style={{
              maxWidth: `${Math.min(settings.layout.containerMaxWidth, 600)}px`,
              padding: `${settings.layout.sectionPadding}px`,
            }}
          >
            <h3 className="font-semibold mb-4">Sample Layout</h3>
            
            <div 
              className="grid grid-cols-2 mb-4"
              style={{ gap: `${settings.layout.gridGap}px` }}
            >
              <div 
                className="bg-muted rounded-lg p-4"
                style={{ padding: `${settings.layout.cardSpacing}px` }}
              >
                <h4 className="font-medium mb-2">Card 1</h4>
                <p className="text-sm text-muted-foreground">Sample content</p>
              </div>
              <div 
                className="bg-muted rounded-lg p-4"
                style={{ padding: `${settings.layout.cardSpacing}px` }}
              >
                <h4 className="font-medium mb-2">Card 2</h4>
                <p className="text-sm text-muted-foreground">Sample content</p>
              </div>
            </div>

            <div 
              className="bg-muted rounded-lg p-4"
              style={{ padding: `${settings.layout.cardSpacing}px` }}
            >
              <h4 className="font-medium mb-2">Full Width Card</h4>
              <p className="text-sm text-muted-foreground">
                This demonstrates the card spacing and section padding settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LayoutControls;
