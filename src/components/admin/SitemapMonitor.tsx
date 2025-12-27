import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { sitemapService } from '@/services/sitemapService';
import { RefreshCw, Globe, Check, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SitemapMetrics {
  totalEntries: number;
  lastGenerated: Date | null;
  submissionStatus: any;
  coverage: {
    comedians: number;
    events: number;
    static: number;
  };
}

export const SitemapMonitor = () => {
  const [metrics, setMetrics] = useState<SitemapMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await sitemapService.getSitemapMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error loading sitemap metrics:', error);
      toast.error('Failed to load sitemap metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (type: string = 'main') => {
    try {
      setRegenerating(type);
      await sitemapService.regenerateAndSubmit(type);
      toast.success(`${type} sitemap regenerated and submitted successfully`);
      await loadMetrics();
    } catch (error) {
      console.error('Error regenerating sitemap:', error);
      toast.error(`Failed to regenerate ${type} sitemap`);
    } finally {
      setRegenerating(null);
    }
  };

  const getSitemapUrl = (type: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/sitemap${type === 'main' ? '' : `-${type}`}.xml`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No sitemap data available</p>
        </CardContent>
      </Card>
    );
  }

  const totalCoverage = metrics.coverage.comedians + metrics.coverage.events + metrics.coverage.static;
  const coveragePercentage = totalCoverage > 0 ? (metrics.totalEntries / totalCoverage) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Sitemap Management
          </CardTitle>
          <CardDescription>
            Monitor and manage XML sitemaps for search engine optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Total Entries</p>
              <p className="text-2xl font-bold">{metrics.totalEntries}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Last Generated</p>
              <p className="text-sm text-muted-foreground">
                {metrics.lastGenerated 
                  ? format(metrics.lastGenerated, 'PPpp')
                  : 'Never'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Coverage</p>
              <Progress value={coveragePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {Math.round(coveragePercentage)}% indexed
              </p>
            </div>
          </div>

          {/* Sitemap Types */}
          <div className="space-y-4">
            <h3 className="font-semibold">Sitemap Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['main', 'comedians', 'events'].map((type) => (
                <Card key={type}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base capitalize">{type}</CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(getSitemapUrl(type), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">Entries</p>
                      <p className="font-medium">
                        {type === 'main' 
                          ? metrics.totalEntries
                          : type === 'comedians'
                          ? metrics.coverage.comedians
                          : metrics.coverage.events}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="professional-button"
                      className="w-full"
                      onClick={() => handleRegenerate(type)}
                      disabled={regenerating === type}
                    >
                      {regenerating === type ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Submission Status */}
          <div className="space-y-4">
            <h3 className="font-semibold">Search Engine Submission</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">G</span>
                  </div>
                  <div>
                    <p className="font-medium">Google</p>
                    <p className="text-xs text-muted-foreground">
                      {metrics.submissionStatus.google?.date 
                        ? `Submitted ${format(new Date(metrics.submissionStatus.google.date), 'PP')}`
                        : 'Not submitted'}
                    </p>
                  </div>
                </div>
                <Badge variant={metrics.submissionStatus.google?.submitted ? 'success' : 'secondary'}>
                  {metrics.submissionStatus.google?.submitted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-teal-600">B</span>
                  </div>
                  <div>
                    <p className="font-medium">Bing</p>
                    <p className="text-xs text-muted-foreground">
                      {metrics.submissionStatus.bing?.date 
                        ? `Submitted ${format(new Date(metrics.submissionStatus.bing.date), 'PP')}`
                        : 'Not submitted'}
                    </p>
                  </div>
                </div>
                <Badge variant={metrics.submissionStatus.bing?.submitted ? 'success' : 'secondary'}>
                  {metrics.submissionStatus.bing?.submitted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={() => handleRegenerate('main')}
              disabled={regenerating !== null}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate All Sitemaps
            </Button>
            <Button
              className="professional-button"
              onClick={() => window.open('https://search.google.com/search-console', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Search Console
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};