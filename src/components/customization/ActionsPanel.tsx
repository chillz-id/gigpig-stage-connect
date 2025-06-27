
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, RefreshCw } from 'lucide-react';

interface ActionsPanelProps {
  themeName: string;
  setThemeName: (name: string) => void;
  themeDescription: string;
  setThemeDescription: (description: string) => void;
  saveTheme: () => void;
  resetToDefault: () => void;
  isSaving: boolean;
}

const ActionsPanel: React.FC<ActionsPanelProps> = ({
  themeName,
  setThemeName,
  themeDescription,
  setThemeDescription,
  saveTheme,
  resetToDefault,
  isSaving
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Theme Name</Label>
          <Input
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            placeholder="Enter theme name"
          />
        </div>
        <div className="space-y-2">
          <Label>Description (Optional)</Label>
          <Textarea
            value={themeDescription}
            onChange={(e) => setThemeDescription(e.target.value)}
            placeholder="Describe this theme"
            rows={2}
          />
        </div>
        <Button 
          onClick={saveTheme} 
          disabled={isSaving || !themeName.trim()}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Theme'}
        </Button>
        <Button 
          onClick={resetToDefault} 
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset to Default
        </Button>
      </CardContent>
    </Card>
  );
};

export default ActionsPanel;
