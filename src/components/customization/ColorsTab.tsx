
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomizationData } from '@/types/customization';

interface ColorsTabProps {
  settings: CustomizationData;
  updateSettings: (section: keyof CustomizationData, key: string, value: any) => void;
}

const ColorsTab: React.FC<ColorsTabProps> = ({ settings, updateSettings }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Scheme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(settings.colors).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={value}
                  onChange={(e) => updateSettings('colors', key, e.target.value)}
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={value}
                  onChange={(e) => updateSettings('colors', key, e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorsTab;
