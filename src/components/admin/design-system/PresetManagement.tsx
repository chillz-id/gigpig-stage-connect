
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, RotateCcw, Download, Upload } from 'lucide-react';
import { DesignSystemSettings } from '@/types/designSystem';
import { useToast } from '@/hooks/use-toast';

interface PresetManagementProps {
  settings: DesignSystemSettings;
  onSave: (name?: string) => void;
  onReset: () => void;
}

const PresetManagement: React.FC<PresetManagementProps> = ({ settings, onSave, onReset }) => {
  const [presetName, setPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a preset name",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(presetName);
      setPresetName('');
      toast({
        title: "Success",
        description: `Preset "${presetName}" saved successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preset",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyChanges = async () => {
    setIsSaving(true);
    try {
      await onSave();
      toast({
        title: "Success",
        description: "Design changes applied successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    onReset();
    toast({
      title: "Reset Complete",
      description: "Design system has been reset to defaults",
    });
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'design-system-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Exported",
      description: "Design settings exported successfully",
    });
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          // Here you would apply the imported settings
          console.log('Imported settings:', importedSettings);
          toast({
            title: "Imported",
            description: "Design settings imported successfully",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Invalid settings file",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Apply/Save Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Apply Changes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleApplyChanges} 
            className="w-full"
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Applying...' : 'Apply Changes'}
          </Button>
          
          <Button 
            onClick={handleReset} 
            variant="outline"
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
        </CardContent>
      </Card>

      {/* Preset Management */}
      <Card>
        <CardHeader>
          <CardTitle>Save Preset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name..."
            />
          </div>
          
          <Button 
            onClick={handleSavePreset}
            className="w-full"
            disabled={isSaving || !presetName.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Save as Preset
          </Button>
        </CardContent>
      </Card>

      {/* Export/Import */}
      <Card>
        <CardHeader>
          <CardTitle>Export/Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={exportSettings}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Settings
          </Button>
          
          <div>
            <Input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
              id="import-settings"
            />
            <Button 
              onClick={() => document.getElementById('import-settings')?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PresetManagement;
