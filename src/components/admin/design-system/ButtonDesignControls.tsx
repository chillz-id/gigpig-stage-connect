
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Square, RotateCcw } from 'lucide-react';
import { DesignSystemSettings } from '@/types/designSystem';

interface ButtonDesignControlsProps {
  settings: DesignSystemSettings;
  updateSetting: (category: string, setting: string, value: any) => void;
}

const ButtonDesignControls: React.FC<ButtonDesignControlsProps> = ({ settings, updateSetting }) => {
  const handleSliderChange = (setting: string, value: number[]) => {
    updateSetting('buttons', setting, value[0]);
  };

  const resetButtonStyles = () => {
    updateSetting('buttons', 'borderRadius', 8);
    updateSetting('buttons', 'borderWidth', 1);
    updateSetting('buttons', 'paddingX', 16);
    updateSetting('buttons', 'paddingY', 8);
    updateSetting('buttons', 'fontSize', 14);
    updateSetting('buttons', 'fontWeight', 500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Square className="w-5 h-5" />
              Button Shape & Size
            </CardTitle>
            <Button className="professional-button" size="sm" onClick={resetButtonStyles}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Border Radius: {settings.buttons.borderRadius}px</Label>
              <Slider
                value={[settings.buttons.borderRadius]}
                onValueChange={(value) => handleSliderChange('borderRadius', value)}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Border Width: {settings.buttons.borderWidth}px</Label>
              <Slider
                value={[settings.buttons.borderWidth]}
                onValueChange={(value) => handleSliderChange('borderWidth', value)}
                min={0}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Horizontal Padding: {settings.buttons.paddingX}px</Label>
              <Slider
                value={[settings.buttons.paddingX]}
                onValueChange={(value) => handleSliderChange('paddingX', value)}
                min={8}
                max={32}
                step={2}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Vertical Padding: {settings.buttons.paddingY}px</Label>
              <Slider
                value={[settings.buttons.paddingY]}
                onValueChange={(value) => handleSliderChange('paddingY', value)}
                min={4}
                max={20}
                step={2}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Font Size: {settings.buttons.fontSize}px</Label>
              <Slider
                value={[settings.buttons.fontSize]}
                onValueChange={(value) => handleSliderChange('fontSize', value)}
                min={10}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Font Weight</Label>
              <Select 
                value={settings.buttons.fontWeight.toString()} 
                onValueChange={(value) => updateSetting('buttons', 'fontWeight', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light (300)</SelectItem>
                  <SelectItem value="400">Normal (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semibold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Button Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <button
                style={{
                  borderRadius: `${settings.buttons.borderRadius}px`,
                  borderWidth: `${settings.buttons.borderWidth}px`,
                  paddingLeft: `${settings.buttons.paddingX}px`,
                  paddingRight: `${settings.buttons.paddingX}px`,
                  paddingTop: `${settings.buttons.paddingY}px`,
                  paddingBottom: `${settings.buttons.paddingY}px`,
                  fontSize: `${settings.buttons.fontSize}px`,
                  fontWeight: settings.buttons.fontWeight,
                }}
                className="bg-primary text-primary-foreground border-primary hover:bg-primary/90 transition-colors"
              >
                Primary Button
              </button>

              <button
                style={{
                  borderRadius: `${settings.buttons.borderRadius}px`,
                  borderWidth: `${settings.buttons.borderWidth}px`,
                  paddingLeft: `${settings.buttons.paddingX}px`,
                  paddingRight: `${settings.buttons.paddingX}px`,
                  paddingTop: `${settings.buttons.paddingY}px`,
                  paddingBottom: `${settings.buttons.paddingY}px`,
                  fontSize: `${settings.buttons.fontSize}px`,
                  fontWeight: settings.buttons.fontWeight,
                }}
                className="bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/90 transition-colors"
              >
                Secondary Button
              </button>

              <button
                style={{
                  borderRadius: `${settings.buttons.borderRadius}px`,
                  borderWidth: `${settings.buttons.borderWidth}px`,
                  paddingLeft: `${settings.buttons.paddingX}px`,
                  paddingRight: `${settings.buttons.paddingX}px`,
                  paddingTop: `${settings.buttons.paddingY}px`,
                  paddingBottom: `${settings.buttons.paddingY}px`,
                  fontSize: `${settings.buttons.fontSize}px`,
                  fontWeight: settings.buttons.fontWeight,
                }}
                className="bg-transparent text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Outline Button
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ButtonDesignControls;
