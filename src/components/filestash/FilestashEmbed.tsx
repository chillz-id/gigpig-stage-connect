import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';

/**
 * Embeds Filestash (self-hosted) using Supabase Session Token authentication.
 *
 * This uses Supabase's S3-compatible storage with the user's JWT for RLS-based access control.
 * Users can only access files in folders they own (based on auth.uid()).
 *
 * Filestash auto-login is achieved via URL query string parameters:
 *   /login?type=s3&access_key_id=user&secret_access_key=x&session_token={jwt}&endpoint={s3_proxy}&path=/media-library
 *
 * Requires:
 * - VITE_FILESTASH_URL (e.g., http://localhost:8090)
 * - VITE_FILESTASH_S3_ENDPOINT (S3 proxy endpoint, e.g., http://s3-proxy:9000)
 */
export function FilestashEmbed() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filestashBase = useMemo(() => {
    const raw = import.meta.env.VITE_FILESTASH_URL || '';
    if (!raw) return null;
    return raw.replace(/\/$/, '');
  }, []);

  // S3 proxy endpoint - Filestash connects to this server-side
  // Default to Docker network address since Filestash runs in same compose stack
  const s3Endpoint = useMemo(() => {
    return import.meta.env.VITE_FILESTASH_S3_ENDPOINT || 'http://s3-proxy:9000';
  }, []);

  const iframeSrc = useMemo(() => {
    if (!filestashBase || !token) return null;
    // Query string login - Filestash reads these params and auto-fills/submits the S3 login form
    // The user's JWT is passed as session_token for S3 authentication
    const queryParams = new URLSearchParams({
      type: 's3',
      access_key_id: 'user',
      secret_access_key: 'x',
      session_token: token,
      endpoint: s3Endpoint,
      path: '/media-library',
      region: 'auto',
    });
    return `${filestashBase}/login?${queryParams.toString()}`;
  }, [filestashBase, token, s3Endpoint]);

  const fetchToken = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get the user's Supabase session token for RLS-based access control
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message || 'Failed to get session');
      }
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      setToken(session.access_token);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get session';
      console.error('Filestash session error', err);
      setError(errorMessage);
      toast({
        title: 'Media library unavailable',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!filestashBase) return;
    fetchToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filestashBase]);

  if (!filestashBase) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6">
          <div className="text-lg font-semibold">Filestash not configured</div>
          <p className="text-sm text-muted-foreground">
            Set VITE_FILESTASH_URL to your Filestash endpoint (e.g., http://localhost:8090).
            Optionally set VITE_FILESTASH_S3_ENDPOINT for the S3 proxy (defaults to http://s3-proxy:9000).
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading && !token) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Preparing media library…</span>
        </CardContent>
      </Card>
    );
  }

  if (error && !token) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6">
          <div className="text-lg font-semibold text-destructive">Unable to load media library</div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="secondary" onClick={fetchToken}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {token && iframeSrc ? (
        <iframe
          title="Media Library"
          src={iframeSrc}
          className="h-[80vh] w-full rounded-lg border border-border bg-background"
        />
      ) : (
        <Card>
          <CardContent className="space-y-3 py-6">
            <div className="text-lg font-semibold">Media library not available</div>
            <p className="text-sm text-muted-foreground">Missing token or URL.</p>
            <Button size="sm" variant="secondary" onClick={fetchToken}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
