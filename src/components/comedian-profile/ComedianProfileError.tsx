
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface ComedianProfileErrorProps {
  slug?: string;
}

const ComedianProfileError: React.FC<ComedianProfileErrorProps> = ({ slug }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Comedian Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find a comedian with the name "{slug?.replace(/-/g, ' ')}"
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComedianProfileError;
