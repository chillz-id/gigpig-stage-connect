import React, { useState } from 'react';
import { TicketSalesDashboard } from '@/components/ticket-sales/TicketSalesDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { webhookProcessorService } from '@/services/webhookProcessorService';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function TicketSalesTestPage() {
  const [testPlatform, setTestPlatform] = useState('humanitix');
  const [testEventType, setTestEventType] = useState('order.created');
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [eventId, setEventId] = useState('');
  const [externalEventId, setExternalEventId] = useState('');
  const { toast } = useToast();

  const handleTestWebhook = async () => {
    setIsProcessing(true);
    setTestResult(null);
    
    try {
      const result = await webhookProcessorService.testWebhookProcessing(testPlatform, testEventType);
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Test successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Test failed",
          description: result.error || result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setTestResult({ success: false, error: error.message });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTestPlatform = async () => {
    if (!eventId || !externalEventId) {
      toast({
        title: "Missing information",
        description: "Please enter both Event ID and External Event ID",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('ticket_platforms')
        .insert({
          event_id: eventId,
          platform: testPlatform,
          external_event_id: externalEventId,
          tickets_sold: 0,
          tickets_available: 100,
          gross_sales: 0,
          is_primary: true,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${testPlatform} platform created for event`,
      });
      
      // Clear inputs
      setEventId('');
      setExternalEventId('');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncEvent = async () => {
    if (!eventId || !externalEventId) {
      toast({
        title: "Missing information",
        description: "Please enter both Event ID and External Event ID",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await webhookProcessorService.syncEventTicketSales(
        eventId,
        testPlatform,
        externalEventId
      );

      if (result.success) {
        toast({
          title: "Sync successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Sync failed",
          description: result.error || result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ticket Sales Integration Testing</h1>
        <p className="text-muted-foreground mt-2">
          Test webhook processing and verify ticket sales integration
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="webhook-test">Webhook Testing</TabsTrigger>
          <TabsTrigger value="platform-setup">Platform Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <TicketSalesDashboard />
        </TabsContent>

        <TabsContent value="webhook-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Webhook Processing</CardTitle>
              <CardDescription>
                Simulate webhook events to test the integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={testPlatform} onValueChange={setTestPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="humanitix">Humanitix</SelectItem>
                      <SelectItem value="eventbrite">Eventbrite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={testEventType} onValueChange={setTestEventType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order.created">Order Created</SelectItem>
                      <SelectItem value="order.updated">Order Updated</SelectItem>
                      <SelectItem value="order.cancelled">Order Cancelled</SelectItem>
                      <SelectItem value="order.refunded">Order Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleTestWebhook} 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Send Test Webhook'
                )}
              </Button>

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{testResult.success ? "Success" : "Failed"}</AlertTitle>
                  <AlertDescription>
                    {testResult.message}
                    {testResult.error && (
                      <pre className="mt-2 text-xs">{testResult.error}</pre>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform-setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Integration Setup</CardTitle>
              <CardDescription>
                Link local events to external ticketing platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Event ID (Local)</Label>
                  <Input 
                    placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    The UUID of the event in your local database
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>External Event ID</Label>
                  <Input 
                    placeholder="e.g., evt_ABC123 (Humanitix) or 123456789 (Eventbrite)"
                    value={externalEventId}
                    onChange={(e) => setExternalEventId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    The event ID from the external ticketing platform
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={testPlatform} onValueChange={setTestPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="humanitix">Humanitix</SelectItem>
                      <SelectItem value="eventbrite">Eventbrite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateTestPlatform} 
                    disabled={isProcessing || !eventId || !externalEventId}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Platform Link'
                    )}
                  </Button>

                  <Button 
                    onClick={handleSyncEvent} 
                    disabled={isProcessing || !eventId || !externalEventId}
                    variant="outline"
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              <p>To receive real webhooks from ticketing platforms:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Deploy the Edge Functions using: <code>supabase functions deploy humanitix-webhook</code></li>
                <li>Configure webhook URLs in your Humanitix/Eventbrite account</li>
                <li>Set the webhook secrets as environment variables</li>
              </ol>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}