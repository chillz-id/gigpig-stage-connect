import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { xeroService } from '@/services/xeroService';
import { toast } from '@/hooks/use-toast';

const XeroCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setError(`Xero authorization failed: ${error}`);
        setIsProcessing(false);
        return;
      }

      if (!code || !state) {
        setError('Invalid callback parameters');
        setIsProcessing(false);
        return;
      }

      try {
        const result = await xeroService.handleCallback(code, state);
        setSuccess(true);
        toast({
          title: "Xero Connected",
          description: result.organizationId
            ? "Your organization's Xero account has been connected successfully."
            : "Your Xero account has been connected successfully.",
        });

        // Redirect after a short delay - org settings or user settings
        setTimeout(() => {
          if (result.organizationId) {
            navigate(`/organization/${result.organizationId}/settings`);
          } else {
            navigate('/settings?tab=integrations');
          }
        }, 2000);
      } catch (err) {
        console.error('Xero callback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to Xero');
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#131b2b] flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-center">
            Xero Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isProcessing && (
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-white">Connecting to Xero...</p>
              <p className="text-purple-200 text-sm mt-2">
                Please wait while we complete the authorization process.
              </p>
            </div>
          )}

          {success && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Successfully Connected!
              </h3>
              <p className="text-purple-200">
                Your Xero account has been connected. Redirecting...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Connection Failed
              </h3>
              <p className="text-red-300 mb-4">{error}</p>
              <div className="space-y-2">
                <Button
                  onClick={() => navigate('/settings?tab=integrations')}
                  className="professional-button w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Return to Settings
                </Button>
                <Button
                  onClick={() => navigate('/settings?tab=integrations')}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default XeroCallback;