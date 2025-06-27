
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { CustomizationData } from '@/types/customization';

interface LivePreviewProps {
  settings: CustomizationData;
}

const LivePreview: React.FC<LivePreviewProps> = ({ settings }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: settings.colors.cardBackground,
            borderColor: settings.colors.border,
            borderRadius: `${settings.components.cardRadius}px`
          }}
        >
          <h3 
            style={{
              color: settings.colors.textPrimary,
              fontSize: `${settings.typography.headingSize}px`,
              fontWeight: settings.typography.headingWeight,
              marginBottom: `${settings.layout.componentSpacing}px`
            }}
          >
            Sample Heading
          </h3>
          <p 
            style={{
              color: settings.colors.textSecondary,
              fontSize: `${settings.typography.bodySize}px`,
              fontWeight: settings.typography.bodyWeight,
              marginBottom: `${settings.layout.componentSpacing}px`
            }}
          >
            This is sample body text to preview your typography settings.
          </p>
          <button 
            style={{
              backgroundColor: settings.colors.primary,
              color: 'white',
              padding: '8px 16px',
              borderRadius: `${settings.components.buttonRadius}px`,
              border: 'none',
              cursor: 'pointer',
              marginRight: `${settings.layout.componentSpacing}px`
            }}
          >
            Primary Button
          </button>
          <div 
            style={{
              width: `${settings.components.profilePictureSize}px`,
              height: `${settings.components.profilePictureSize}px`,
              backgroundColor: settings.colors.secondary,
              borderRadius: settings.components.profilePictureShape === 'circle' ? '50%' : `${settings.components.cardRadius}px`,
              marginTop: `${settings.layout.componentSpacing}px`
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default LivePreview;
