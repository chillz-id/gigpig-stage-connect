import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Instagram, Search } from 'lucide-react';

interface NotFoundHandlerProps {
  profileType: 'comedian' | 'manager' | 'organization' | 'venue';
  attemptedSlug: string;
}

export function NotFoundHandler({ profileType, attemptedSlug }: NotFoundHandlerProps) {
  const [instagramHandle, setInstagramHandle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleRequestProfile = async () => {
    if (!attemptedSlug) {
      toast({
        title: 'Error',
        description: 'No profile slug provided',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the record_profile_request function
      await supabase.rpc('record_profile_request', {
        p_profile_type: profileType,
        p_slug: attemptedSlug,
        p_instagram_handle: instagramHandle || null,
        p_user_id: null,
      });

      toast({
        title: 'Request Recorded',
        description: `We've recorded your interest in this ${profileType} profile. We'll reach out if we find them!`,
      });

      // Clear the input
      setInstagramHandle('');
    } catch (error) {
      console.error('Error recording profile request:', error);
      toast({
        title: 'Error',
        description: 'Failed to record request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const profileTypeLabel = profileType.charAt(0).toUpperCase() + profileType.slice(1);
  const browsePath = `/${profileType}s`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-700 via-purple-600 to-purple-800 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-3xl">Profile Not Found</CardTitle>
          <CardDescription className="text-lg mt-2">
            We couldn't find a {profileTypeLabel.toLowerCase()} profile with the handle "{attemptedSlug}"
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Request Profile Section */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Know this {profileTypeLabel.toLowerCase()}?</h3>
              <p className="text-sm text-muted-foreground">
                Help us find them! If you know their Instagram handle, let us know and we'll try to reach out.
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="@instagram_handle (optional)"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>

              <Button
                onClick={handleRequestProfile}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? 'Recording Request...' : 'Request This Profile'}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">or</span>
            </div>
          </div>

          {/* Browse Section */}
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Browse All {profileTypeLabel}s</h3>
            <p className="text-sm text-muted-foreground">
              Check out other {profileTypeLabel.toLowerCase()} profiles on our platform
            </p>

            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to={browsePath}>
                <Search className="mr-2 h-4 w-4" />
                Browse {profileTypeLabel}s
              </Link>
            </Button>
          </div>

          {/* Back to Home */}
          <div className="text-center pt-4 border-t border-border">
            <Button asChild variant="ghost">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
