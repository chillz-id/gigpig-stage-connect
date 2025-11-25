import React, { useState, useEffect } from 'react';
import AutoSaveStatus, { AutoSaveIcon } from './AutoSaveStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';

// Demo component to showcase all AutoSaveStatus states
export const AutoSaveStatusDemo: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [autoDemo, setAutoDemo] = useState(false);

  // Auto-demo sequence
  useEffect(() => {
    if (!autoDemo) return;

    const sequence = async () => {
      // Start saving
      setStatus('saving');
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show saved
      setStatus('saved');
      setLastSaved(new Date());
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Show another save
      setStatus('saving');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show error
      setStatus('error');
      setError(new Error('Network connection failed'));
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Reset to idle
      setStatus('idle');
      setAutoDemo(false);
    };

    sequence();
  }, [autoDemo]);

  const simulateSave = () => {
    setStatus('saving');
    setError(null);
    
    setTimeout(() => {
      const shouldError = Math.random() > 0.7; // 30% chance of error
      
      if (shouldError) {
        setStatus('error');
        setError(new Error('Failed to save changes'));
      } else {
        setStatus('saved');
        setLastSaved(new Date());
      }
    }, 1500);
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">AutoSaveStatus Component Demo</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visual indicators for auto-save functionality with smooth transitions and theme support.
        </p>
      </div>

      {/* Theme Switcher */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Test the component in different themes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === 'business' ? 'default' : 'secondary'}
              onClick={() => setTheme('business')}
            >
              Business Theme
            </Button>
            <Button
              variant={theme === 'pleasure' ? 'default' : 'secondary'}
              onClick={() => setTheme('pleasure')}
            >
              Pleasure Theme
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Demo</CardTitle>
          <CardDescription>Click buttons to trigger different states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setStatus('idle')}>Set Idle</Button>
            <Button onClick={() => setStatus('saving')}>Set Saving</Button>
            <Button onClick={() => {
              setStatus('saved');
              setLastSaved(new Date());
            }}>Set Saved</Button>
            <Button onClick={() => {
              setStatus('error');
              setError(new Error('Connection timeout'));
            }}>Set Error</Button>
            <Button onClick={simulateSave} variant="secondary">
              Simulate Save (Random)
            </Button>
            <Button onClick={() => setAutoDemo(true)} className="professional-button">
              Run Auto Demo
            </Button>
          </div>
          
          <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Status Component:</p>
            <div className="flex items-center justify-center h-16">
              <AutoSaveStatus
                status={status}
                lastSaved={lastSaved}
                error={error}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All States Preview */}
      <Card>
        <CardHeader>
          <CardTitle>All States</CardTitle>
          <CardDescription>Preview all possible states side by side</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm font-medium mb-2">Idle (Hidden)</p>
                <div className="h-10 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded">
                  <AutoSaveStatus status="idle" lastSaved={null} error={null} />
                  <span className="text-gray-400 text-sm">Component is hidden</span>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm font-medium mb-2">Saving</p>
                <div className="h-10 flex items-center justify-center">
                  <AutoSaveStatus status="saving" lastSaved={null} error={null} />
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm font-medium mb-2">Saved</p>
                <div className="h-10 flex items-center justify-center">
                  <AutoSaveStatus status="saved" lastSaved={new Date()} error={null} />
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm font-medium mb-2">Error</p>
                <div className="h-10 flex items-center justify-center">
                  <AutoSaveStatus status="error" lastSaved={null} error={new Error('Network error')} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Icon-Only Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Icon-Only Mode</CardTitle>
          <CardDescription>Minimal icon indicators for constrained spaces</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm font-medium mb-2">Saving</p>
                <div className="h-10 flex items-center justify-center">
                  <AutoSaveIcon status="saving" lastSaved={null} error={null} />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium mb-2">Saved</p>
                <div className="h-10 flex items-center justify-center">
                  <AutoSaveIcon status="saved" lastSaved={new Date()} error={null} />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium mb-2">Error</p>
                <div className="h-10 flex items-center justify-center">
                  <AutoSaveIcon status="error" lastSaved={null} error={new Error('Failed')} />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium mb-2">With Text</p>
                <div className="h-10 flex items-center justify-center">
                  <AutoSaveIcon status="saving" lastSaved={null} error={null} showText />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>Common implementation patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`// Basic usage
<AutoSaveStatus
  status={saveStatus}
  lastSaved={lastSavedDate}
  error={saveError}
/>

// Positioned in corner
<AutoSaveStatus
  status={saveStatus}
  lastSaved={lastSavedDate}
  error={saveError}
  className="fixed bottom-4 right-4"
/>

// Icon-only mode
<AutoSaveIcon
  status={saveStatus}
  lastSaved={lastSavedDate}
  error={saveError}
/>

// Icon with text
<AutoSaveIcon
  status={saveStatus}
  lastSaved={lastSavedDate}
  error={saveError}
  showText
/>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoSaveStatusDemo;