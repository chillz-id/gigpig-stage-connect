import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Palette, Clock, User, Zap, Settings, Moon, Sun,
  Calendar, MapPin, Smartphone, Monitor, Eye,
  Lightbulb, Timer, RotateCcw, Save, AlertCircle
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';

const ThemeSettings = () => {
  const { 
    theme, 
    setTheme, 
    autoTheme, 
    setAutoTheme, 
    schedule, 
    setSchedule,
    getRecommendedTheme 
  } = useTheme();
  const { toast } = useToast();
  
  const [localSchedule, setLocalSchedule] = useState(schedule);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(theme);

  const handleScheduleChange = (key: keyof typeof schedule, value: any) => {
    const newSchedule = { ...localSchedule, [key]: value };
    setLocalSchedule(newSchedule);
  };

  const saveSchedule = () => {
    setSchedule(localSchedule);
    toast({
      title: "Settings Saved",
      description: "Theme schedule has been updated successfully",
    });
  };

  const resetToDefaults = () => {
    const defaultSchedule = {
      enabled: false,
      businessStart: '09:00',
      businessEnd: '17:00',
      autoSwitch: true
    };
    setLocalSchedule(defaultSchedule);
    setSchedule(defaultSchedule);
    setAutoTheme(false);
    toast({
      title: "Reset Complete",
      description: "All theme settings have been reset to defaults",
    });
  };

  const previewThemeChange = (newTheme: 'business' | 'pleasure') => {
    setPreviewTheme(newTheme);
    setPreviewMode(true);
    
    // Reset preview after 3 seconds
    setTimeout(() => {
      setPreviewMode(false);
      setPreviewTheme(theme);
    }, 3000);
  };

  const currentRecommendation = getRecommendedTheme();
  const isScheduleChanged = JSON.stringify(schedule) !== JSON.stringify(localSchedule);

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { value: `${hour}:00`, label: `${hour}:00` };
  });

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Theme Settings
            <Badge className="professional-button ml-2">
              {autoTheme ? 'Auto' : theme === 'business' ? 'Business' : 'Pleasure'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/5 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Current Theme</p>
                    <h3 className={`text-lg font-bold ${theme === 'business' ? 'text-red-400' : 'text-purple-400'}`}>
                      {theme === 'business' ? 'Business' : 'Pleasure'}
                    </h3>
                  </div>
                  {theme === 'business' ? 
                    <User className="w-8 h-8 text-red-400" /> : 
                    <Zap className="w-8 h-8 text-purple-400" />
                  }
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Recommended</p>
                    <h3 className={`text-lg font-bold ${currentRecommendation === 'business' ? 'text-red-400' : 'text-purple-400'}`}>
                      {currentRecommendation === 'business' ? 'Business' : 'Pleasure'}
                    </h3>
                  </div>
                  <Lightbulb className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Auto Mode</p>
                    <h3 className={`text-lg font-bold ${autoTheme ? 'text-green-400' : 'text-gray-400'}`}>
                      {autoTheme ? 'Enabled' : 'Disabled'}
                    </h3>
                  </div>
                  <Clock className={`w-8 h-8 ${autoTheme ? 'text-green-400' : 'text-gray-400'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setTheme('business')}
              variant={theme === 'business' && !autoTheme ? 'default' : 'secondary'}
              className="bg-gradient-to-r from-gray-700 to-red-700 hover:from-gray-600 hover:to-red-600 text-white border-none"
            >
              <User className="w-4 h-4 mr-2" />
              Business Mode
            </Button>
            
            <Button
              onClick={() => setTheme('pleasure')}
              variant={theme === 'pleasure' && !autoTheme ? 'default' : 'secondary'}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-none"
            >
              <Zap className="w-4 h-4 mr-2" />
              Pleasure Mode
            </Button>
            
            <Button
              onClick={() => setAutoTheme(!autoTheme)}
              variant={autoTheme ? 'default' : 'secondary'}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-none"
            >
              <Clock className="w-4 h-4 mr-2" />
              Auto Mode
            </Button>
          </div>

          {/* Preview Controls */}
          <Card className="bg-white/5 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Theme Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={() => previewThemeChange('business')}
                  className="professional-button"
                  disabled={previewMode}
                  className="text-white border-white/20"
                >
                  <User className="w-4 h-4 mr-2" />
                  Preview Business
                </Button>
                
                <Button
                  onClick={() => previewThemeChange('pleasure')}
                  className="professional-button"
                  disabled={previewMode}
                  className="text-white border-white/20"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Preview Pleasure
                </Button>
              </div>
              
              {previewMode && (
                <Alert className="bg-blue-500/20 border-blue-500/50">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-white">
                    Preview mode active - theme will revert in 3 seconds
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Auto Theme Schedule */}
          <Card className="bg-white/5 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Auto Theme Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Enable scheduled theme switching</Label>
                  <p className="text-gray-400 text-sm">Automatically switch between business and pleasure modes</p>
                </div>
                <Switch
                  checked={localSchedule.enabled}
                  onCheckedChange={(checked) => handleScheduleChange('enabled', checked)}
                />
              </div>
              
              {localSchedule.enabled && (
                <div className="space-y-4 pt-4 border-t border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Business hours start
                      </Label>
                      <Select
                        value={localSchedule.businessStart}
                        onValueChange={(value) => handleScheduleChange('businessStart', value)}
                      >
                        <SelectTrigger className="bg-white/20 border-white/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Business hours end
                      </Label>
                      <Select
                        value={localSchedule.businessEnd}
                        onValueChange={(value) => handleScheduleChange('businessEnd', value)}
                      >
                        <SelectTrigger className="bg-white/20 border-white/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Auto-switch themes</Label>
                      <p className="text-gray-400 text-sm">Automatically switch when schedule times are reached</p>
                    </div>
                    <Switch
                      checked={localSchedule.autoSwitch}
                      onCheckedChange={(checked) => handleScheduleChange('autoSwitch', checked)}
                    />
                  </div>
                  
                  <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <div className="flex items-start gap-2">
                      <Timer className="w-4 h-4 text-blue-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-blue-400 font-medium">Schedule Summary</p>
                        <p className="text-white">
                          Business mode: {localSchedule.businessStart} - {localSchedule.businessEnd}
                        </p>
                        <p className="text-white">
                          Pleasure mode: {localSchedule.businessEnd} - {localSchedule.businessStart} (next day)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              onClick={resetToDefaults}
              className="professional-button text-red-400 border-red-400/50 hover:bg-red-400/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            
            <div className="flex gap-2">
              {isScheduleChanged && (
                <Badge className="professional-button self-center text-yellow-400 border-yellow-400/50">
                  Unsaved changes
                </Badge>
              )}
              <Button
                onClick={saveSchedule}
                disabled={!isScheduleChanged}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemeSettings;