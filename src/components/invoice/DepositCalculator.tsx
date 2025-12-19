// Deposit Calculator Component - Handles deposit calculations and configuration
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ChevronDown, ChevronUp, Percent, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { InvoiceFormData } from '@/hooks/useInvoiceFormState';

interface DepositCalculatorProps {
  invoiceData: InvoiceFormData;
  onUpdateInvoiceData: (updates: Partial<InvoiceFormData>) => void;
  total: number;
  depositAmount: number;
  remainingAmount: number;
  showDepositSection: boolean;
  onToggleDepositSection: (show: boolean) => void;
}

export const DepositCalculator: React.FC<DepositCalculatorProps> = ({
  invoiceData,
  onUpdateInvoiceData,
  total,
  depositAmount,
  remainingAmount,
  showDepositSection,
  onToggleDepositSection
}) => {
  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Deposit Configuration</CardTitle>
            <CardDescription>
              Configure deposit requirements for this invoice
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleDepositSection(!showDepositSection)}
            className="flex items-center gap-2"
          >
            {showDepositSection ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Configure
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {showDepositSection && (
        <CardContent className="space-y-4">
          {/* Require Deposit Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requireDeposit"
              checked={invoiceData.requireDeposit}
              onChange={(e) => onUpdateInvoiceData({ requireDeposit: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <Label htmlFor="requireDeposit" className="text-sm font-medium">
              Require deposit for this invoice
            </Label>
          </div>

          {invoiceData.requireDeposit && (
            <>
              {/* Deposit Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="depositType">Deposit Type</Label>
                  <Select
                    value={invoiceData.depositType}
                    onValueChange={(value: 'amount' | 'percentage') => 
                      onUpdateInvoiceData({ depositType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Percentage
                        </div>
                      </SelectItem>
                      <SelectItem value="amount">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Fixed Amount
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Deposit Value Input */}
                <div className="space-y-2">
                  <Label htmlFor="depositValue">
                    {invoiceData.depositType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                  </Label>
                  {invoiceData.depositType === 'percentage' ? (
                    <div className="relative">
                      <Input
                        id="depositValue"
                        type="number"
                        min="1"
                        max="100"
                        value={invoiceData.depositPercentage}
                        onChange={(e) => onUpdateInvoiceData({ 
                          depositPercentage: parseFloat(e.target.value) || 0 
                        })}
                        className="pr-8"
                      />
                      <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <Input
                        id="depositValue"
                        type="number"
                        min="0"
                        step="0.01"
                        value={invoiceData.depositAmount}
                        onChange={(e) => onUpdateInvoiceData({ 
                          depositAmount: parseFloat(e.target.value) || 0 
                        })}
                        className="pl-8"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Event Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        className={cn(
                          "professional-button w-full justify-start text-left font-normal",
                          !invoiceData.eventDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {invoiceData.eventDate ? (
                          format(invoiceData.eventDate, "PPP")
                        ) : (
                          <span>Pick event date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={invoiceData.eventDate}
                        onSelect={(date) => onUpdateInvoiceData({ eventDate: date })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Deposit Due Days */}
                <div className="space-y-2">
                  <Label htmlFor="depositDueDays">Deposit Due (days before event)</Label>
                  <Input
                    id="depositDueDays"
                    type="number"
                    min="1"
                    value={invoiceData.depositDueDaysBeforeEvent}
                    onChange={(e) => onUpdateInvoiceData({ 
                      depositDueDaysBeforeEvent: parseInt(e.target.value) || 1 
                    })}
                  />
                </div>
              </div>

              {/* Deposit Summary */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-blue-900">Deposit Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Invoice Amount:</span>
                    <span className="font-medium">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deposit Required:</span>
                    <span className="font-medium text-blue-600">${depositAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span>Remaining Balance:</span>
                    <span className="font-medium">${remainingAmount.toFixed(2)}</span>
                  </div>
                  {invoiceData.eventDate && (
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Deposit Due:</span>
                      <span>
                        {format(
                          new Date(invoiceData.eventDate.getTime() - 
                            invoiceData.depositDueDaysBeforeEvent * 24 * 60 * 60 * 1000), 
                          "PPP"
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default DepositCalculator;