
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Palette, Upload, Save, RotateCcw } from 'lucide-react';

interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logo: string;
  companyName: string;
  tagline: string;
}

interface BrandingCustomizationProps {
  currentBranding: BrandingSettings;
  onSave: (branding: BrandingSettings) => void;
}

const BrandingCustomization: React.FC<BrandingCustomizationProps> = ({
  currentBranding,
  onSave
}) => {
  const [branding, setBranding] = useState<BrandingSettings>(currentBranding);

  const presetColorSchemes = [
    { name: 'Purple Fusion', primary: '#8B5CF6', secondary: '#EC4899', accent: '#F59E0B' },
    { name: 'Ocean Blue', primary: '#0EA5E9', secondary: '#06B6D4', accent: '#10B981' },
    { name: 'Sunset Orange', primary: '#F97316', secondary: '#EF4444', accent: '#FBBF24' },
    { name: 'Forest Green', primary: '#059669', secondary: '#10B981', accent: '#84CC16' },
    { name: 'Royal Purple', primary: '#7C3AED', secondary: '#A855F7', accent: '#C084FC' },
  ];

  const handleColorChange = (colorType: keyof Pick<BrandingSettings, 'primaryColor' | 'secondaryColor' | 'accentColor'>, value: string) => {
    setBranding(prev => ({ ...prev, [colorType]: value }));
  };

  const applyPresetScheme = (scheme: typeof presetColorSchemes[0]) => {
    setBranding(prev => ({
      ...prev,
      primaryColor: scheme.primary,
      secondaryColor: scheme.secondary,
      accentColor: scheme.accent
    }));
  };

  const resetToDefault = () => {
    setBranding(currentBranding);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Brand Customization</span>
          </CardTitle>
          <CardDescription className="text-purple-200">
            Customize your promoter dashboard and event branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/10">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="logo">Logo & Text</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor" className="text-white">Primary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="w-16 h-10 p-1 bg-white/10 border-white/20"
                    />
                    <Input
                      type="text"
                      value={branding.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="flex-1 bg-white/10 border-white/20 text-white"
                      placeholder="#8B5CF6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor" className="text-white">Secondary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={branding.secondaryColor}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      className="w-16 h-10 p-1 bg-white/10 border-white/20"
                    />
                    <Input
                      type="text"
                      value={branding.secondaryColor}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      className="flex-1 bg-white/10 border-white/20 text-white"
                      placeholder="#EC4899"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor" className="text-white">Accent Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={branding.accentColor}
                      onChange={(e) => handleColorChange('accentColor', e.target.value)}
                      className="w-16 h-10 p-1 bg-white/10 border-white/20"
                    />
                    <Input
                      type="text"
                      value={branding.accentColor}
                      onChange={(e) => handleColorChange('accentColor', e.target.value)}
                      className="flex-1 bg-white/10 border-white/20 text-white"
                      placeholder="#F59E0B"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-white">Preset Color Schemes</Label>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {presetColorSchemes.map((scheme, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => applyPresetScheme(scheme)}
                      className="flex flex-col items-center space-y-2 h-auto p-3 text-white border-white/30 hover:bg-white/10"
                    >
                      <div className="flex space-x-1">
                        <div 
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: scheme.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: scheme.secondary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: scheme.accent }}
                        />
                      </div>
                      <span className="text-xs">{scheme.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logo" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-white">Company Name</Label>
                    <Input
                      id="companyName"
                      value={branding.companyName}
                      onChange={(e) => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tagline" className="text-white">Tagline</Label>
                    <Input
                      id="tagline"
                      value={branding.tagline}
                      onChange={(e) => setBranding(prev => ({ ...prev, tagline: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Your company tagline"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Logo</Label>
                    <div className="flex flex-col items-center space-y-3 p-6 border-2 border-dashed border-white/30 rounded-lg">
                      {branding.logo ? (
                        <img src={branding.logo} alt="Logo" className="w-20 h-20 object-contain" />
                      ) : (
                        <div className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center">
                          <Upload className="w-8 h-8 text-purple-300" />
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-white border-white/30 hover:bg-white/10"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <div className="space-y-4">
                <Label className="text-white">Dashboard Preview</Label>
                <Card 
                  className="border-2"
                  style={{ 
                    borderColor: branding.primaryColor,
                    background: `linear-gradient(135deg, ${branding.primaryColor}20, ${branding.secondaryColor}20)`
                  }}
                >
                  <CardHeader style={{ backgroundColor: `${branding.primaryColor}40` }}>
                    <div className="flex items-center space-x-3">
                      {branding.logo ? (
                        <img src={branding.logo} alt="Logo" className="w-10 h-10 object-contain" />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: branding.primaryColor }}
                        >
                          {branding.companyName ? branding.companyName.charAt(0) : 'L'}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-white">
                          {branding.companyName || 'Your Company Name'}
                        </CardTitle>
                        <CardDescription className="text-white/80">
                          {branding.tagline || 'Your company tagline'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div 
                          className="w-full h-16 rounded-lg flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: branding.primaryColor }}
                        >
                          Primary
                        </div>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-full h-16 rounded-lg flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: branding.secondaryColor }}
                        >
                          Secondary
                        </div>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-full h-16 rounded-lg flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: branding.accentColor }}
                        >
                          Accent
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={resetToDefault}
              className="text-white border-white/30 hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
            <Button
              onClick={() => onSave(branding)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Branding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandingCustomization;
