import { MediaBrowser } from '@/components/media/MediaBrowser';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MediaBrowserTest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Media Browser Test</CardTitle>
            <CardDescription>Please log in to test the media browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Media Browser Test</h1>
          <p className="text-sm text-muted-foreground">
            Custom file browser with ToastUI integration
          </p>
        </div>
      </div>

      {/* Feature overview */}
      <div className="bg-muted/50 border-b px-4 py-2">
        <p className="text-sm text-muted-foreground">
          <strong>Features:</strong> Browse files • Upload • Edit with ToastUI • Set as Profile Pic/Banner • Rename • Delete
        </p>
      </div>

      {/* Media Browser */}
      <div className="flex-1 overflow-hidden">
        <MediaBrowser />
      </div>
    </div>
  );
}
