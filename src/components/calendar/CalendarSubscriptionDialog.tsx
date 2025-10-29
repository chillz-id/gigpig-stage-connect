import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCalendarSubscription } from '@/hooks/useCalendarSubscription';
import { Copy, RefreshCw, Check, Apple, Calendar as GoogleIcon } from 'lucide-react';
import { useState } from 'react';

interface CalendarSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendarSubscriptionDialog({ open, onOpenChange }: CalendarSubscriptionDialogProps) {
  const { subscription, isLoading, regenerateToken, isRegenerating, getSubscriptionUrl } = useCalendarSubscription();
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || !subscription) {
    return null;
  }

  const webcalUrl = getSubscriptionUrl(subscription.token, 'webcal');
  const httpsUrl = getSubscriptionUrl(subscription.token, 'https');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subscribe to Your Calendar</DialogTitle>
          <DialogDescription>
            Add your gigs to any calendar app. Your calendar will automatically update when you add or remove gigs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subscription URL */}
          <div>
            <label className="text-sm font-medium mb-2 block">Subscription URL</label>
            <div className="flex gap-2">
              <Input value={webcalUrl} readOnly />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(webcalUrl)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Platform Instructions */}
          <Tabs defaultValue="apple" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="apple">
                <Apple className="mr-2 h-4 w-4" />
                Apple
              </TabsTrigger>
              <TabsTrigger value="google">
                <GoogleIcon className="mr-2 h-4 w-4" />
                Google
              </TabsTrigger>
              <TabsTrigger value="outlook">
                <GoogleIcon className="mr-2 h-4 w-4" />
                Outlook
              </TabsTrigger>
            </TabsList>

            <TabsContent value="apple" className="space-y-2">
              <h4 className="font-medium">Apple Calendar (Mac/iPhone/iPad)</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Open Calendar app</li>
                <li>Go to File → New Calendar Subscription (Mac) or Settings → Accounts → Add Account → Other (iOS)</li>
                <li>Paste the subscription URL above</li>
                <li>Click Subscribe and choose update frequency</li>
              </ol>
            </TabsContent>

            <TabsContent value="google" className="space-y-2">
              <h4 className="font-medium">Google Calendar</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Open Google Calendar on web</li>
                <li>Click the + next to "Other calendars"</li>
                <li>Select "From URL"</li>
                <li>Paste this URL: <code className="text-xs bg-muted px-1 py-0.5 rounded">{httpsUrl}</code></li>
                <li>Click "Add calendar"</li>
              </ol>
              <p className="text-xs text-muted-foreground">Note: Google Calendar uses HTTPS, not webcal://</p>
            </TabsContent>

            <TabsContent value="outlook" className="space-y-2">
              <h4 className="font-medium">Outlook (Desktop/Web)</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Open Outlook Calendar</li>
                <li>Click "Add calendar" → "Subscribe from web"</li>
                <li>Paste the subscription URL above</li>
                <li>Enter a name (e.g., "My Comedy Gigs")</li>
                <li>Click Import</li>
              </ol>
            </TabsContent>
          </Tabs>

          {/* Regenerate Token */}
          <div className="border-t pt-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-sm">Regenerate Subscription Link</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  If you think your link has been compromised, you can generate a new one. Your old link will stop working.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => regenerateToken()}
                disabled={isRegenerating}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
