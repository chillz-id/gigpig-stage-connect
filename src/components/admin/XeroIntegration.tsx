import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, Zap, Sync, Download, Upload, Settings, 
  DollarSign, Receipt, Users, Calendar, AlertCircle,
  CheckCircle, Clock, FileText, BarChart3, RefreshCw,
  ArrowRight, Eye, ExternalLink, Wallet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface XeroConnection {
  connected: boolean;
  organizationName?: string;
  lastSync?: string;
  connectionExpires?: string;
  tenantId?: string;
}

interface XeroInvoice {
  id: string;
  invoiceNumber: string;
  contactName: string;
  amount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'AUTHORISED' | 'PAID' | 'VOIDED';
  date: string;
  dueDate: string;
  eventTitle?: string;
}

interface XeroContact {
  id: string;
  name: string;
  email: string;
  contactType: 'Customer' | 'Supplier';
  syncedFromPlatform: boolean;
}

interface SyncStats {
  invoicesSynced: number;
  contactsSynced: number;
  paymentsSynced: number;
  lastSyncTime: string;
  errors: number;
}

const XeroIntegration = () => {
  const [connection, setConnection] = useState<XeroConnection>({ connected: false });
  const [invoices, setInvoices] = useState<XeroInvoice[]>([]);
  const [contacts, setContacts] = useState<XeroContact[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [autoSync, setAutoSync] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState('daily');
  const { toast } = useToast();

  const loadXeroData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, fetch from your backend
      const mockConnection: XeroConnection = {
        connected: true,
        organizationName: 'iD Comedy Pty Ltd',
        lastSync: '2025-01-02T10:30:00Z',
        connectionExpires: '2025-04-02T10:30:00Z',
        tenantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      };

      const mockInvoices: XeroInvoice[] = [
        {
          id: 'INV-001',
          invoiceNumber: 'INV-2025-001',
          contactName: 'The Comedy Store',
          amount: 2500.00,
          status: 'AUTHORISED',
          date: '2025-01-01',
          dueDate: '2025-01-31',
          eventTitle: 'New Year Comedy Gala'
        },
        {
          id: 'INV-002',
          invoiceNumber: 'INV-2025-002',
          contactName: 'Sarah Mitchell',
          amount: 350.00,
          status: 'PAID',
          date: '2025-01-02',
          dueDate: '2025-02-01',
          eventTitle: 'Stand-up Night at The Basement'
        },
        {
          id: 'INV-003',
          invoiceNumber: 'INV-2025-003',
          contactName: 'Comedy Central Sydney',
          amount: 1800.00,
          status: 'DRAFT',
          date: '2025-01-02',
          dueDate: '2025-02-15',
          eventTitle: 'Open Mic Tournament'
        }
      ];

      const mockContacts: XeroContact[] = [
        {
          id: 'CONT-001',
          name: 'The Comedy Store',
          email: 'bookings@comedystore.com.au',
          contactType: 'Customer',
          syncedFromPlatform: true
        },
        {
          id: 'CONT-002',
          name: 'Sarah Mitchell',
          email: 'sarah@example.com',
          contactType: 'Supplier',
          syncedFromPlatform: true
        },
        {
          id: 'CONT-003',
          name: 'Comedy Central Sydney',
          email: 'admin@comedycentral.com.au',
          contactType: 'Customer',
          syncedFromPlatform: false
        }
      ];

      const mockStats: SyncStats = {
        invoicesSynced: 156,
        contactsSynced: 89,
        paymentsSynced: 142,
        lastSyncTime: '2025-01-02T10:30:00Z',
        errors: 2
      };

      setConnection(mockConnection);
      setInvoices(mockInvoices);
      setContacts(mockContacts);
      setSyncStats(mockStats);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load Xero data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadXeroData();
  }, [loadXeroData]);

  const connectToXero = async () => {
    setLoading(true);
    try {
      // In real implementation, redirect to Xero OAuth
      window.open('https://login.xero.com/identity/connect/authorize?...', '_blank');
      
      toast({
        title: "Connecting to Xero",
        description: "Please complete the authorization in the new window.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to Xero. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectFromXero = async () => {
    try {
      setConnection({ connected: false });
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Xero.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect from Xero.",
        variant: "destructive",
      });
    }
  };

  const syncData = async () => {
    setSyncInProgress(true);
    setSyncProgress(0);
    
    try {
      // Simulate sync progress
      const steps = ['Syncing invoices', 'Syncing contacts', 'Syncing payments', 'Finalizing'];
      
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSyncProgress((i + 1) * 25);
      }
      
      // Refresh data after sync
      await loadXeroData();
      
      toast({
        title: "Sync Complete",
        description: "All data has been synchronized with Xero.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Some data could not be synchronized.",
        variant: "destructive",
      });
    } finally {
      setSyncInProgress(false);
      setSyncProgress(0);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'DRAFT': { color: 'bg-gray-500', text: 'Draft' },
      'SUBMITTED': { color: 'bg-blue-500', text: 'Submitted' },
      'AUTHORISED': { color: 'bg-yellow-500', text: 'Authorised' },
      'PAID': { color: 'bg-green-500', text: 'Paid' },
      'VOIDED': { color: 'bg-red-500', text: 'Voided' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap['DRAFT'];
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU');
  };

  const ConnectionTab = () => (
    <div className="space-y-6">
      {!connection.connected ? (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Connect to Xero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              Connect your Xero account to automatically sync invoices, payments, and financial data.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="text-white font-medium mb-2">Benefits:</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Automatic invoice creation</li>
                  <li>• Real-time payment tracking</li>
                  <li>• Simplified tax reporting</li>
                  <li>• Contact synchronization</li>
                </ul>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="text-white font-medium mb-2">What we sync:</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Event invoices</li>
                  <li>• Comedian payments</li>
                  <li>• Venue contracts</li>
                  <li>• Customer contacts</li>
                </ul>
              </div>
            </div>
            <Button 
              onClick={connectToXero} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Connect to Xero
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Connected to Xero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Organization</Label>
                <p className="text-white font-medium">{connection.organizationName}</p>
              </div>
              <div>
                <Label className="text-gray-300">Last Sync</Label>
                <p className="text-white font-medium">
                  {connection.lastSync ? formatDate(connection.lastSync) : 'Never'}
                </p>
              </div>
              <div>
                <Label className="text-gray-300">Connection Expires</Label>
                <p className="text-white font-medium">
                  {connection.connectionExpires ? formatDate(connection.connectionExpires) : 'Unknown'}
                </p>
              </div>
              <div>
                <Label className="text-gray-300">Tenant ID</Label>
                <p className="text-white font-medium text-xs">{connection.tenantId}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={syncData} 
                disabled={syncInProgress}
                className="bg-green-600 hover:bg-green-700"
              >
                <Sync className="w-4 h-4 mr-2" />
                {syncInProgress ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button 
                className="professional-button"
                onClick={disconnectFromXero}
                className="text-red-400 border-red-400/50 hover:bg-red-400/10"
              >
                Disconnect
              </Button>
            </div>

            {syncInProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Syncing data...</span>
                  <span className="text-white">{syncProgress}%</span>
                </div>
                <Progress value={syncProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync Statistics */}
      {syncStats && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Sync Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{syncStats.invoicesSynced}</div>
                <div className="text-sm text-gray-300">Invoices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{syncStats.contactsSynced}</div>
                <div className="text-sm text-gray-300">Contacts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{syncStats.paymentsSynced}</div>
                <div className="text-sm text-gray-300">Payments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{syncStats.errors}</div>
                <div className="text-sm text-gray-300">Errors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const InvoicesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white text-lg font-semibold">Xero Invoices</h3>
        <div className="flex gap-2">
          <Button className="professional-button text-white border-white/20">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Receipt className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{invoice.invoiceNumber}</span>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <p className="text-gray-300">{invoice.contactName}</p>
                  {invoice.eventTitle && (
                    <p className="text-sm text-gray-400">Event: {invoice.eventTitle}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>Date: {formatDate(invoice.date)}</span>
                    <span>Due: {formatDate(invoice.dueDate)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">
                    {formatCurrency(invoice.amount)}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="professional-button text-white border-white/20">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="sm" className="professional-button text-white border-white/20">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const ContactsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white text-lg font-semibold">Xero Contacts</h3>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
          <Users className="w-4 h-4 mr-2" />
          Sync Contacts
        </Button>
      </div>

      <div className="grid gap-4">
        {contacts.map((contact) => (
          <Card key={contact.id} className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{contact.name}</span>
                    <Badge className="professional-button" className={
                      contact.contactType === 'Customer' ? 'border-green-500/50 text-green-400' : 'border-blue-500/50 text-blue-400'
                    }>
                      {contact.contactType}
                    </Badge>
                    {contact.syncedFromPlatform && (
                      <Badge className="professional-button border-purple-500/50 text-purple-400">
                        Synced
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm">{contact.email}</p>
                </div>
                <Button size="sm" className="professional-button text-white border-white/20">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Sync Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Auto-sync enabled</Label>
              <p className="text-gray-400 text-sm">Automatically sync data with Xero</p>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
          </div>
          
          <div className="space-y-2">
            <Label className="text-white">Sync frequency</Label>
            <select 
              value={syncFrequency} 
              onChange={(e) => setSyncFrequency(e.target.value)}
              className="w-full p-2 bg-white/20 border border-white/30 rounded text-white"
            >
              <option value="hourly">Every hour</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Invoice Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Default account code</Label>
            <Input 
              placeholder="e.g. 200 - Sales"
              className="bg-white/20 border-white/30 text-white placeholder:text-gray-400"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-white">Tax rate</Label>
            <select className="w-full p-2 bg-white/20 border border-white/30 rounded text-white">
              <option value="gst">GST (10%)</option>
              <option value="exempt">Tax Exempt</option>
              <option value="zero">Zero Rate</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading && !connection.connected) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Loading Xero integration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Xero Integration
            {connection.connected && (
              <Badge className="bg-green-500 ml-2">Connected</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connection" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10">
              <TabsTrigger value="connection" className="text-white data-[state=active]:bg-purple-600">
                Connection
              </TabsTrigger>
              <TabsTrigger value="invoices" className="text-white data-[state=active]:bg-purple-600">
                Invoices
              </TabsTrigger>
              <TabsTrigger value="contacts" className="text-white data-[state=active]:bg-purple-600">
                Contacts
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-white data-[state=active]:bg-purple-600">
                Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="connection" className="mt-6">
              <ConnectionTab />
            </TabsContent>
            
            <TabsContent value="invoices" className="mt-6">
              <InvoicesTab />
            </TabsContent>
            
            <TabsContent value="contacts" className="mt-6">
              <ContactsTab />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-6">
              <SettingsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default XeroIntegration;
