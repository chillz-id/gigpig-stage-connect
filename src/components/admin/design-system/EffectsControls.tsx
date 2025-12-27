
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, RotateCcw } from 'lucide-react';
import { DesignSystemSettings } from '@/types/designSystem';

interface EffectsControlsProps {
  settings: DesignSystemSettings;
  updateSetting: (category: string, setting: string, value: any) => void;
}

const EffectsControls: React.FC<EffectsControlsProps> = ({ settings, updateSetting }) => {
  const handleSliderChange = (setting: string, value: number[]) => {
    updateSetting('effects', setting, value[0]);
  };

  const resetEffects = () => {
    updateSetting('effects', 'shadowIntensity', 0.1);
    updateSetting('effects', 'blurIntensity', 12);
    updateSetting('effects', 'animationSpeed', 'normal');
    updateSetting('effects', 'hoverScale', 1.02);
  };

  const animationSpeeds = [
    { value: 'slow', label: 'Slow (0.5s)' },
    { value: 'normal', label: 'Normal (0.3s)' },
    { value: 'fast', label: 'Fast (0.15s)' },
    { value: 'instant', label: 'Instant (0.1s)' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Visual Effects
            </CardTitle>
            <Button className="professional-button" size="sm" onClick={resetEffects}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Shadow Intensity: {settings.effects.shadowIntensity}</Label>
              <Slider
                value={[settings.effects.shadowIntensity]}
                onValueChange={(value) => handleSliderChange('shadowIntensity', value)}
                min={0}
                max={0.5}
                step={0.05}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Blur Intensity: {settings.effects.blurIntensity}px</Label>
              <Slider
                value={[settings.effects.blurIntensity]}
                onValueChange={(value) => handleSliderChange('blurIntensity', value)}
                min={0}
                max={24}
                step={2}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Animation Speed</Label>
              <Select 
                value={settings.effects.animationSpeed} 
                onValueChange={(value) => updateSetting('effects', 'animationSpeed', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {animationSpeeds.map((speed) => (
                    <SelectItem key={speed.value} value={speed.value}>
                      {speed.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Hover Scale: {settings.effects.hoverScale}</Label>
              <Slider
                value={[settings.effects.hoverScale]}
                onValueChange={(value) => handleSliderChange('hoverScale', value)}
                min={1.0}
                max={1.1}
                step={0.01}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Effects Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Effects Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shadow Preview */}
              <div 
                className="bg-card rounded-lg p-4 transition-all duration-300"
                style={{
                  boxShadow: `0 4px 20px rgba(0, 0, 0, ${settings.effects.shadowIntensity})`,
                  transitionDuration: settings.effects.animationSpeed === 'slow' ? '0.5s' :
                                   settings.effects.animationSpeed === 'normal' ? '0.3s' :
                                   settings.effects.animationSpeed === 'fast' ? '0.15s' : '0.1s',
                }}
              >
                <h4 className="font-medium mb-2">Shadow Effect</h4>
                <p className="text-sm text-muted-foreground">
                  This card demonstrates the current shadow intensity setting
                </p>
              </div>

              {/* Hover Effect Preview */}
              <div 
                className="bg-card rounded-lg p-4 transition-all duration-300 cursor-pointer hover:shadow-lg"
                style={{
                  transitionDuration: settings.effects.animationSpeed === 'slow' ? '0.5s' :
                                   settings.effects.animationSpeed === 'normal' ? '0.3s' :
                                   settings.effects.animationSpeed === 'fast' ? '0.15s' : '0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = `scale(${settings.effects.hoverScale})`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <h4 className="font-medium mb-2">Hover Effect</h4>
                <p className="text-sm text-muted-foreground">
                  Hover over this card to see the scale effect
                </p>
              </div>
            </div>

            {/* Animation Speed Demo */}
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-3">Animation Speed Demo</h4>
              <div className="flex gap-2">
                <Button
                  className="professional-button transition-all"
                  size="sm"
                  style={{
                    transitionDuration: settings.effects.animationSpeed === 'slow' ? '0.5s' :
                                     settings.effects.animationSpeed === 'normal' ? '0.3s' :
                                     settings.effects.animationSpeed === 'fast' ? '0.15s' : '0.1s',
                  }}
                >
                  Sample Button
                </Button>
                <div className="text-sm text-muted-foreground self-center">
                  Current speed: {settings.effects.animationSpeed}
                </div>
              </div>
            </div>

            {/* Blur Effect Info */}
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-2">Blur Effect</h4>
              <p className="text-sm text-muted-foreground">
                Current blur intensity: {settings.effects.blurIntensity}px
                <br />
                <span className="text-xs">Note: Blur effects are applied to backdrop elements and modals</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EffectsControls;
