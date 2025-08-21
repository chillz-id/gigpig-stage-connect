
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const ComedianProfileLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-32 h-32 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-8 bg-muted rounded w-64"></div>
                    <div className="h-4 bg-muted rounded w-48"></div>
                    <div className="flex gap-2">
                      <div className="h-10 bg-muted rounded w-32"></div>
                      <div className="h-10 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Content skeletons */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComedianProfileLoader;
