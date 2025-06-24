
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Youtube, Image } from 'lucide-react';

export const MediaPortfolio: React.FC = () => {
  return (
    <Card className="professional-card">
      <CardHeader>
        <CardTitle>Media & Portfolio</CardTitle>
        <CardDescription>
          Showcase your best work to potential promoters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label>Show Reel</Label>
            <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center">
              <div className="text-muted-foreground">
                <Youtube className="w-8 h-8 mx-auto mb-2" />
                <p>Upload your show reel video or add YouTube link</p>
                <Button variant="outline" className="mt-2">Add Video</Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Photo Gallery</Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Add Photo
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button className="professional-button">Update Media</Button>
        </div>
      </CardContent>
    </Card>
  );
};
