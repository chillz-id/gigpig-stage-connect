
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { XeroSyncButton } from './XeroSyncButton';

export const FinancialInformation: React.FC = () => {
  const { toast } = useToast();
  
  const [financialInfo, setFinancialInfo] = useState({
    accountName: '',
    bsb: '',
    accountNumber: '',
    abn: '',
  });

  const updateFinancialInfo = (field: keyof typeof financialInfo, value: string) => {
    setFinancialInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveFinancialInfo = () => {
    toast({
      title: "Financial Information Saved",
      description: "Your financial details have been updated.",
    });
  };

  return (
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Financial Information
        </CardTitle>
        <CardDescription>
          Optional - Only required for invoice generation and payment processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg mb-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This information is optional and only needed if you plan to generate invoices or receive payments through the platform. You can use all other features without providing these details.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              value={financialInfo.accountName}
              onChange={(e) => updateFinancialInfo('accountName', e.target.value)}
              placeholder="Your full legal name or business name"
            />
          </div>
          <div>
            <Label htmlFor="bsb">BSB</Label>
            <Input
              id="bsb"
              value={financialInfo.bsb}
              onChange={(e) => updateFinancialInfo('bsb', e.target.value)}
              placeholder="123-456"
              maxLength={7}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={financialInfo.accountNumber}
              onChange={(e) => updateFinancialInfo('accountNumber', e.target.value)}
              placeholder="Your bank account number"
            />
          </div>
          <div>
            <Label htmlFor="abn">ABN</Label>
            <Input
              id="abn"
              value={financialInfo.abn}
              onChange={(e) => updateFinancialInfo('abn', e.target.value)}
              placeholder="12 345 678 901"
              maxLength={14}
            />
          </div>
        </div>

        <Button onClick={handleSaveFinancialInfo} className="professional-button">
          Save Financial Information
        </Button>

        {/* XERO Integration Section */}
        <XeroSyncButton />
      </CardContent>
    </Card>
  );
};
