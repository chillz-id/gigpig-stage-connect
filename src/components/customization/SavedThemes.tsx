
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download } from 'lucide-react';

interface SavedTheme {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface SavedThemesProps {
  savedThemes: SavedTheme[];
  loadTheme: (themeId: string) => void;
  applyTheme: (themeId: string) => void;
}

const SavedThemes: React.FC<SavedThemesProps> = ({ savedThemes, loadTheme, applyTheme }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Themes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {savedThemes.map((theme) => (
            <div key={theme.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium">{theme.name}</h4>
                  {theme.description && (
                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                  )}
                </div>
                {theme.is_active && (
                  <Badge variant="default">Active</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadTheme(theme.id)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Load
                </Button>
                <Button
                  size="sm"
                  onClick={() => applyTheme(theme.id)}
                  disabled={theme.is_active}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Apply
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SavedThemes;
