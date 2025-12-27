import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calculateGST, type GSTMode } from '@/utils/gst-calculator';
import { DollarSign, Percent } from 'lucide-react';

interface DealTerms {
  dealType: 'ticket_sales' | 'door_sales' | 'merch_sales' | 'venue_hire' | 'custom';
  customDealName?: string;
  splitType: 'percentage' | 'flat_fee' | 'door_split' | 'guaranteed_minimum';
  amount: number;
  amountType: 'dollar' | 'percent';
  gstMode: GSTMode;
}

interface DealTermsConfiguratorProps {
  defaultGstMode: GSTMode;
  onConfigure: (terms: DealTerms) => void;
}

export function DealTermsConfigurator({
  defaultGstMode,
  onConfigure,
}: DealTermsConfiguratorProps) {
  const [dealType, setDealType] = useState<DealTerms['dealType']>('ticket_sales');
  const [customDealName, setCustomDealName] = useState('');
  const [splitType, setSplitType] = useState<DealTerms['splitType']>('percentage');
  const [amount, setAmount] = useState<string>('');
  const [amountType, setAmountType] = useState<'dollar' | 'percent'>('percent');
  const [gstMode, setGstMode] = useState<GSTMode>(defaultGstMode);

  const toggleAmountType = () => {
    setAmountType((prev) => (prev === 'dollar' ? 'percent' : 'dollar'));
  };

  const numericAmount = parseFloat(amount) || 0;
  const gstCalculation = amountType === 'dollar' ? calculateGST(numericAmount, gstMode) : null;

  const handleConfigure = () => {
    onConfigure({
      dealType,
      customDealName: dealType === 'custom' ? customDealName : undefined,
      splitType,
      amount: numericAmount,
      amountType,
      gstMode,
    });
  };

  return (
    <div className="space-y-6">
      {/* Deal Type */}
      <div className="space-y-2">
        <Label htmlFor="deal-type">Deal Type</Label>
        <Select value={dealType} onValueChange={(value: any) => setDealType(value)}>
          <SelectTrigger id="deal-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ticket_sales">Ticket Sales</SelectItem>
            <SelectItem value="door_sales">Door Sales</SelectItem>
            <SelectItem value="merch_sales">Merch Sales</SelectItem>
            <SelectItem value="venue_hire">Venue Hire</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Deal Name */}
      {dealType === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="custom-deal-name">Custom Deal Name</Label>
          <Input
            id="custom-deal-name"
            placeholder="Enter custom deal name"
            value={customDealName}
            onChange={(e) => setCustomDealName(e.target.value)}
          />
        </div>
      )}

      {/* Split Type */}
      <div className="space-y-2">
        <Label htmlFor="split-type">Split Type</Label>
        <Select value={splitType} onValueChange={(value: any) => setSplitType(value)}>
          <SelectTrigger id="split-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="flat_fee">Flat Fee</SelectItem>
            <SelectItem value="door_split">Door Split</SelectItem>
            <SelectItem value="guaranteed_minimum">Guaranteed Minimum</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Amount Input with Toggle */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            {amountType === 'dollar' ? (
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            ) : null}
            <Input
              id="amount"
              type="number"
              placeholder={amountType === 'dollar' ? '1000' : '50'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={amountType === 'dollar' ? 'pl-8' : ''}
            />
            {amountType === 'percent' ? (
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            ) : null}
          </div>
          <Button
            type="button"
            className="professional-button"
            size="icon"
            onClick={toggleAmountType}
            title={`Switch to ${amountType === 'dollar' ? 'percentage' : 'dollar'}`}
          >
            {amountType === 'dollar' ? (
              <Percent className="h-4 w-4" />
            ) : (
              <DollarSign className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* GST Mode */}
      <div className="space-y-2">
        <Label htmlFor="gst-mode">GST Treatment</Label>
        <Select value={gstMode} onValueChange={(value: GSTMode) => setGstMode(value)}>
          <SelectTrigger id="gst-mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inclusive">GST Inclusive</SelectItem>
            <SelectItem value="exclusive">GST Exclusive</SelectItem>
            <SelectItem value="none">No GST</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Preview Calculation (only for dollar amounts) */}
      {amountType === 'dollar' && numericAmount > 0 && gstCalculation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment Breakdown</CardTitle>
            <CardDescription>Based on {gstMode} GST treatment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Total:</span>
              <span className="font-medium">${gstCalculation.gross.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (10%):</span>
              <span className="font-medium">${gstCalculation.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Net Amount:</span>
              <span className="font-semibold">${gstCalculation.net.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configure Button */}
      <Button onClick={handleConfigure} className="w-full">
        Add Participant with These Terms
      </Button>
    </div>
  );
}
