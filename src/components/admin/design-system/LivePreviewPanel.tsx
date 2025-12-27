
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Monitor, Smartphone } from 'lucide-react';
import { DesignSystemSettings } from '@/types/designSystem';

interface LivePreviewPanelProps {
  settings: DesignSystemSettings;
}

const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({ settings }) => {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop');

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Live Preview
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'desktop' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className={`border rounded-lg p-4 space-y-4 transition-all duration-300 ${
            viewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
          }`}
          style={{
            backgroundColor: settings.colors.background,
            color: settings.colors.foreground,
          }}
        >
          {/* Sample Card */}
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: settings.colors.card,
              borderColor: settings.colors.border,
            }}
          >
            <h3 
              className="font-semibold mb-2"
              style={{ color: settings.colors.foreground }}
            >
              Sample Event Card
            </h3>
            <p 
              className="text-sm mb-3"
              style={{ color: settings.colors['muted-foreground'] }}
            >
              Comedy Night at The Laugh Track - Join us for an evening of hilarious stand-up comedy.
            </p>
            
            <div className="flex gap-2 mb-3">
              <Badge 
                style={{ 
                  backgroundColor: settings.colors.primary + '20',
                  color: settings.colors.primary 
                }}
              >
                Comedy
              </Badge>
              <Badge 
                style={{ 
                  backgroundColor: settings.colors.secondary + '20',
                  color: settings.colors.secondary 
                }}
              >
                Stand-up
              </Badge>
            </div>

            <button
              style={{
                backgroundColor: settings.colors.primary,
                color: settings.colors['primary-foreground'],
                borderRadius: `${settings.buttons.borderRadius}px`,
                paddingLeft: `${settings.buttons.paddingX}px`,
                paddingRight: `${settings.buttons.paddingX}px`,
                paddingTop: `${settings.buttons.paddingY}px`,
                paddingBottom: `${settings.buttons.paddingY}px`,
                fontSize: `${settings.buttons.fontSize}px`,
                fontWeight: settings.buttons.fontWeight,
                border: `${settings.buttons.borderWidth}px solid ${settings.colors.primary}`,
              }}
              className="w-full hover:opacity-90 transition-opacity"
            >
              Apply Now
            </button>
          </div>

          {/* Sample Text Elements */}
          <div className="space-y-2">
            <h1 
              className="text-2xl font-bold"
              style={{ color: settings.colors.foreground }}
            >
              Sample Heading
            </h1>
            <p 
              style={{ color: settings.colors['muted-foreground'] }}
            >
              This is sample body text to preview your design changes in real-time.
            </p>
            <a 
              href="#" 
              className="text-sm hover:underline"
              style={{ color: settings.colors.primary }}
            >
              Sample Link
            </a>
          </div>

          {/* Sample Navigation */}
          <div 
            className="flex gap-2 p-2 rounded"
            style={{ backgroundColor: settings.colors.muted }}
          >
            <button
              style={{
                backgroundColor: settings.colors.primary,
                color: settings.colors['primary-foreground'],
                borderRadius: `${settings.buttons.borderRadius}px`,
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: settings.buttons.fontWeight,
              }}
            >
              Active
            </button>
            <button
              style={{
                backgroundColor: 'transparent',
                color: settings.colors['muted-foreground'],
                borderRadius: `${settings.buttons.borderRadius}px`,
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: settings.buttons.fontWeight,
              }}
              className="hover:bg-gray-200/50"
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Glass Effect Demo */}
        <div className="relative p-6 rounded-lg overflow-hidden mt-4">
          {/* Background pattern to show blur effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 opacity-30"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 20 0 L 0 0 0 20" fill="none" stroke="%23ffffff" stroke-width="1" opacity="0.1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)" /%3E%3C/svg%3E")'
          }}></div>
          
          {/* Glass card with dynamic blur */}
          <div 
            className="relative glass-card p-4"
            style={{
              borderColor: settings.colors.border,
            }}
          >
            <h4 className="font-semibold text-white mb-2">
              Glass Effect Demo (Blur: {settings.effects.blurIntensity}px)
            </h4>
            <p className="text-white/80 text-sm">
              This card demonstrates the dynamic blur effect. Adjust the blur intensity slider to see it change in real-time.
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Changes apply in real-time
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LivePreviewPanel;
