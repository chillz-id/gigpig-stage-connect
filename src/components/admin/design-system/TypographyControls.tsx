
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, RotateCcw } from 'lucide-react';
import { DesignSystemSettings } from '@/types/designSystem';

interface TypographyControlsProps {
  settings: DesignSystemSettings;
  updateSetting: (category: string, setting: string, value: any) => void;
}

const TypographyControls: React.FC<TypographyControlsProps> = ({ settings, updateSetting }) => {
  const handleSliderChange = (setting: string, value: number[]) => {
    updateSetting('typography', setting, value[0]);
  };

  const resetTypography = () => {
    updateSetting('typography', 'headingFont', 'Inter');
    updateSetting('typography', 'bodyFont', 'Inter');
    updateSetting('typography', 'h1Size', 32);
    updateSetting('typography', 'h2Size', 24);
    updateSetting('typography', 'h3Size', 20);
    updateSetting('typography', 'bodySize', 16);
    updateSetting('typography', 'smallSize', 14);
    updateSetting('typography', 'lineHeight', 1.5);
    updateSetting('typography', 'letterSpacing', 0);
  };

  const fontOptions = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro',
    'Poppins', 'Oswald', 'Raleway', 'Nunito', 'Ubuntu', 'Merriweather',
    'Playfair Display', 'Lora', 'PT Sans', 'Crimson Text'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              Font Families
            </CardTitle>
            <Button className="professional-button" size="sm" onClick={resetTypography}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Heading Font</Label>
              <Select 
                value={settings.typography.headingFont} 
                onValueChange={(value) => updateSetting('typography', 'headingFont', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: font }}>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Body Font</Label>
              <Select 
                value={settings.typography.bodyFont} 
                onValueChange={(value) => updateSetting('typography', 'bodyFont', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: font }}>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Font Sizes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>H1 Size: {settings.typography.h1Size}px</Label>
              <Slider
                value={[settings.typography.h1Size]}
                onValueChange={(value) => handleSliderChange('h1Size', value)}
                min={20}
                max={48}
                step={2}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>H2 Size: {settings.typography.h2Size}px</Label>
              <Slider
                value={[settings.typography.h2Size]}
                onValueChange={(value) => handleSliderChange('h2Size', value)}
                min={16}
                max={36}
                step={2}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>H3 Size: {settings.typography.h3Size}px</Label>
              <Slider
                value={[settings.typography.h3Size]}
                onValueChange={(value) => handleSliderChange('h3Size', value)}
                min={14}
                max={28}
                step={2}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Body Size: {settings.typography.bodySize}px</Label>
              <Slider
                value={[settings.typography.bodySize]}
                onValueChange={(value) => handleSliderChange('bodySize', value)}
                min={12}
                max={24}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Small Size: {settings.typography.smallSize}px</Label>
              <Slider
                value={[settings.typography.smallSize]}
                onValueChange={(value) => handleSliderChange('smallSize', value)}
                min={10}
                max={18}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Line Height: {settings.typography.lineHeight}</Label>
              <Slider
                value={[settings.typography.lineHeight]}
                onValueChange={(value) => handleSliderChange('lineHeight', value)}
                min={1.0}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Letter Spacing: {settings.typography.letterSpacing}px</Label>
              <Slider
                value={[settings.typography.letterSpacing]}
                onValueChange={(value) => handleSliderChange('letterSpacing', value)}
                min={-2}
                max={4}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Typography Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h1 
              style={{
                fontFamily: settings.typography.headingFont,
                fontSize: `${settings.typography.h1Size}px`,
                lineHeight: settings.typography.lineHeight,
                letterSpacing: `${settings.typography.letterSpacing}px`,
              }}
              className="font-bold"
            >
              H1 Heading Sample
            </h1>
            
            <h2 
              style={{
                fontFamily: settings.typography.headingFont,
                fontSize: `${settings.typography.h2Size}px`,
                lineHeight: settings.typography.lineHeight,
                letterSpacing: `${settings.typography.letterSpacing}px`,
              }}
              className="font-semibold"
            >
              H2 Heading Sample
            </h2>
            
            <h3 
              style={{
                fontFamily: settings.typography.headingFont,
                fontSize: `${settings.typography.h3Size}px`,
                lineHeight: settings.typography.lineHeight,
                letterSpacing: `${settings.typography.letterSpacing}px`,
              }}
              className="font-medium"
            >
              H3 Heading Sample
            </h3>
            
            <p 
              style={{
                fontFamily: settings.typography.bodyFont,
                fontSize: `${settings.typography.bodySize}px`,
                lineHeight: settings.typography.lineHeight,
                letterSpacing: `${settings.typography.letterSpacing}px`,
              }}
            >
              Body text sample - This is how your regular paragraph text will appear throughout the website. It should be easy to read and well-spaced.
            </p>
            
            <small 
              style={{
                fontFamily: settings.typography.bodyFont,
                fontSize: `${settings.typography.smallSize}px`,
                lineHeight: settings.typography.lineHeight,
                letterSpacing: `${settings.typography.letterSpacing}px`,
              }}
              className="text-muted-foreground"
            >
              Small text sample for captions and footnotes
            </small>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TypographyControls;
