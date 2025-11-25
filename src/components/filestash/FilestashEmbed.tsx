import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';

interface TokenResponse {
  token?: string;
  scopes?: string[];
  expires_in?: number;
}

/**
 * Embeds Filestash (self-hosted) and fetches a scoped token via Supabase function filestash-token.
 * Requires:
 * - VITE_FILESTASH_URL (e.g., http://localhost:8334 or reverse-proxied /filestash)
 * - Supabase function filestash-token deployed
 */
export function FilestashEmbed() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [scopes, setScopes] = useState<string[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filestashBase = useMemo(() => {
    const raw = import.meta.env.VITE_FILESTASH_URL || '';
    if (!raw) return null;
    return raw.replace(/\/$/, '');
  }, []);

  const iframeSrc = useMemo(() => {
    if (!filestashBase || !token) return null;
    return `${filestashBase}/?token=${encodeURIComponent(token)}`;
  }, [filestashBase, token]);

  const fetchToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke<TokenResponse>('filestash-token');
      if (error) {
        throw new Error(error.message || 'Failed to fetch token');
      }
      if (!data?.token) {
        throw new Error('Token missing in response');
      }
      setToken(data.token);
      setScopes(data.scopes);
    } catch (err: any) {
      console.error('Filestash token error', err);
      setError(err?.message || 'Failed to fetch token');
      toast({
        title: 'Media library unavailable',
        description: err?.message || 'Could not fetch access token',
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
            Set VITE_FILESTASH_URL to your Filestash endpoint (e.g., http://localhost:8334 or /filestash).
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
          <Button size="sm" variant="outline" onClick={fetchToken}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {scopes && (
        <div className="text-xs text-muted-foreground">
          Scopes: {scopes.join(', ')}
        </div>
      )}
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
            <Button size="sm" variant="outline" onClick={fetchToken}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
