
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Palette, RotateCcw } from 'lucide-react';
import { DesignSystemSettings } from '@/types/designSystem';

interface ColorSystemControlsProps {
  settings: DesignSystemSettings;
  updateSetting: (category: string, setting: string, value: any) => void;
}

const ColorSystemControls: React.FC<ColorSystemControlsProps> = ({ settings, updateSetting }) => {
  const colorCategories = [
    {
      title: 'Primary Colors',
      colors: [
        { key: 'primary', label: 'Primary', description: 'Main brand color for buttons and links' },
        { key: 'secondary', label: 'Secondary', description: 'Secondary brand color for accents' },
        { key: 'accent', label: 'Accent', description: 'Accent color for highlights' }
      ]
    },
    {
      title: 'Background Colors',
      colors: [
        { key: 'background', label: 'Background', description: 'Main page background' },
        { key: 'card', label: 'Card Background', description: 'Card and panel backgrounds' },
        { key: 'muted', label: 'Muted Background', description: 'Subtle background for sections' }
      ]
    },
    {
      title: 'Text Colors',
      colors: [
        { key: 'foreground', label: 'Primary Text', description: 'Main text color' },
        { key: 'muted-foreground', label: 'Muted Text', description: 'Secondary text color' },
        { key: 'primary-foreground', label: 'Primary Button Text', description: 'Text on primary backgrounds' }
      ]
    },
    {
      title: 'Status Colors',
      colors: [
        { key: 'destructive', label: 'Error/Danger', description: 'Error states and danger actions' },
        { key: 'success', label: 'Success', description: 'Success states and confirmations' },
        { key: 'warning', label: 'Warning', description: 'Warning states and cautions' }
      ]
    }
  ];

  const handleColorChange = (colorKey: string, value: string) => {
    updateSetting('colors', colorKey, value);
  };

  const resetCategory = (category: string) => {
    // Reset specific category to defaults
    console.log(`Resetting ${category} to defaults`);
  };

  return (
    <div className="space-y-6">
      {colorCategories.map((category) => (
        <Card key={category.title}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                {category.title}
              </CardTitle>
              <Button 
                className="professional-button" 
                size="sm"
                onClick={() => resetCategory(category.title)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category.colors.map((color) => (
                <div key={color.key} className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">{color.label}</Label>
                    <p className="text-xs text-muted-foreground mt-1">{color.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Color preview */}
                    <div 
                      className="w-12 h-10 rounded-lg border-2 border-border shadow-sm"
                      style={{ 
                        backgroundColor: settings.colors[color.key] || '#000000'
                      }}
                    />
                    
                    {/* Color picker */}
                    <Input
                      type="color"
                      value={settings.colors[color.key] || '#000000'}
                      onChange={(e) => handleColorChange(color.key, e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    
                    {/* Hex input */}
                    <Input
                      type="text"
                      value={settings.colors[color.key] || '#000000'}
                      onChange={(e) => handleColorChange(color.key, e.target.value)}
                      placeholder="#000000"
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Color Palette Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Current Color Palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(settings.colors).map(([key, value]) => (
              <div key={key} className="text-center">
                <div 
                  className="w-full h-16 rounded-lg border-2 border-border shadow-sm mb-2"
                  style={{ backgroundColor: value }}
                />
                <p className="text-xs font-medium capitalize">{key.replace('-', ' ')}</p>
                <p className="text-xs text-muted-foreground font-mono">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColorSystemControls;
