import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleMapsSetupCardProps {
  onDismiss?: () => void;
}

export const GoogleMapsSetupCard: React.FC<GoogleMapsSetupCardProps> = ({ onDismiss }) => {
  return (
    <Card className="bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="w-5 h-5" />
          Google Maps Setup Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 mt-0.5 text-yellow-600 dark:text-yellow-400" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
              To enable address autocomplete and location features, you need to configure Google Maps API.
            </p>
            <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              <p>1. Get an API key from Google Cloud Console</p>
              <p>2. Enable: Maps JavaScript API, Places API, Geocoding API</p>
              <p>3. Set VITE_GOOGLE_MAPS_API_KEY environment variable</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            className="professional-button text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-200 dark:border-yellow-700 dark:hover:bg-yellow-800/30"
            onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Get API Key
          </Button>
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              className="text-yellow-700 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-800/30"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </div>
        
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          <strong>Note:</strong> Address input will work manually without API configuration.
        </p>
      </CardContent>
    </Card>
  );
};