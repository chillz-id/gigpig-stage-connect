
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Users, Clock, DollarSign } from 'lucide-react';
import { EventSpot } from '@/types/eventTypes';

interface EventSpotManagerFixedProps {
  spots: EventSpot[];
  onSpotsChange: (spots: EventSpot[]) => void;
}

export const EventSpotManagerFixed: React.FC<EventSpotManagerFixedProps> = ({
  spots,
  onSpotsChange
}) => {
  const [newSpot, setNewSpot] = useState<EventSpot>({
    spot_name: '',
    is_paid: false,
    payment_amount: 0,
    currency: 'AUD',
    duration_minutes: 5,
    payment_type: 'flat_fee' // New field for payment type
  });

  const addSpot = () => {
    if (newSpot.spot_name.trim()) {
      onSpotsChange([...spots, { ...newSpot }]);
      setNewSpot({
        spot_name: '',
        is_paid: false,
        payment_amount: 0,
        currency: 'AUD',
        duration_minutes: 5,
        payment_type: 'flat_fee'
      });
    }
  };

  const removeSpot = (index: number) => {
    onSpotsChange(spots.filter((_, i) => i !== index));
  };

  const handlePaymentAmountChange = (value: string) => {
    const numericValue = parseFloat(value.replace(/^0+(?=\d)/, '') || '0');
    setNewSpot(prev => ({ ...prev, payment_amount: numericValue }));
  };

  const isPercentagePayment = newSpot.payment_type === 'percentage_ticket_sales' || newSpot.payment_type === 'percentage_door_sales';

  // Mock data for real-time calculation preview
  const mockEventData = {
    ticketSales: 1250.00,
    doorSales: 800.00,
    totalRevenue: 2050.00
  };

  const calculatePaymentPreview = (spot: typeof newSpot) => {
    if (!spot.is_paid || spot.payment_amount <= 0) return 0;
    
    switch (spot.payment_type) {
      case 'flat_fee':
        return spot.payment_amount;
      case 'percentage_ticket_sales':
        return (mockEventData.ticketSales * spot.payment_amount) / 100;
      case 'percentage_door_sales':
        return (mockEventData.doorSales * spot.payment_amount) / 100;
      default:
        return spot.payment_amount;
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Performance Spots
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="spotName">Spot Name *</Label>
            <Input
              id="spotName"
              value={newSpot.spot_name}
              onChange={(e) => setNewSpot(prev => ({ ...prev, spot_name: e.target.value }))}
              placeholder="Opening Act, Feature, etc."
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
            />
          </div>
          
          <div>
            <Label htmlFor="duration">Duration (min)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="60"
              value={newSpot.duration_minutes}
              onChange={(e) => setNewSpot(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 5 }))}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
            />
          </div>

          <div>
            <Label htmlFor="paymentType">Payment Type</Label>
            <Select 
              value={newSpot.is_paid ? newSpot.payment_type : 'unpaid'} 
              onValueChange={(value) => {
                if (value === 'unpaid') {
                  setNewSpot(prev => ({ ...prev, is_paid: false, payment_type: 'flat_fee', payment_amount: 0 }));
                } else {
                  setNewSpot(prev => ({ ...prev, is_paid: true, payment_type: value as any }));
                }
              }}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="flat_fee">Flat Fee</SelectItem>
                <SelectItem value="percentage_ticket_sales">% of Ticket Sales</SelectItem>
                <SelectItem value="percentage_door_sales">% of Door Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newSpot.is_paid && (
            <>
              <div>
                <Label htmlFor="paymentAmount">
                  Amount {isPercentagePayment ? '(%)' : `(${newSpot.currency})`}
                </Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step={isPercentagePayment ? "0.1" : "0.01"}
                  min="0"
                  max={isPercentagePayment ? "100" : undefined}
                  value={newSpot.payment_amount === 0 ? '' : newSpot.payment_amount}
                  onChange={(e) => handlePaymentAmountChange(e.target.value)}
                  placeholder={isPercentagePayment ? "10.0" : "0.00"}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
              </div>

              {!isPercentagePayment && (
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <CurrencySelector
                    value={newSpot.currency}
                    onChange={(currency) => setNewSpot(prev => ({ ...prev, currency }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Payment Preview */}
        {newSpot.is_paid && newSpot.payment_amount > 0 && (
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-300/20">
            <Label className="text-sm font-medium text-blue-200 mb-2 block">Payment Preview (Based on Mock Data)</Label>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-300">Ticket Sales: AUD {mockEventData.ticketSales.toFixed(2)}</p>
                <p className="text-gray-300">Door Sales: AUD {mockEventData.doorSales.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-green-300 font-medium">
                  Estimated Payment: AUD {calculatePaymentPreview(newSpot).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  {newSpot.payment_type === 'flat_fee' && 'Fixed amount'}
                  {newSpot.payment_type === 'percentage_ticket_sales' && `${newSpot.payment_amount}% of ticket sales`}
                  {newSpot.payment_type === 'percentage_door_sales' && `${newSpot.payment_amount}% of door sales`}
                </p>
              </div>
            </div>
          </div>
        )}

        <Button 
          type="button" 
          onClick={addSpot} 
          disabled={!newSpot.spot_name.trim()}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Spot
        </Button>

        {spots.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Performance Lineup</Label>
            <div className="space-y-2">
              {spots.map((spot, index) => (
                <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-white border-white/30">
                        {spot.spot_name}
                      </Badge>
                      <span className="text-sm text-gray-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {spot.duration_minutes}min
                      </span>
                    </div>
                    <X 
                      className="w-4 h-4 cursor-pointer hover:text-red-300" 
                      onClick={() => removeSpot(index)}
                    />
                  </div>
                  {spot.is_paid && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">
                        {spot.payment_type === 'flat_fee' && `Flat Fee: ${spot.currency} ${spot.payment_amount?.toFixed(2)}`}
                        {spot.payment_type === 'percentage_ticket_sales' && `${spot.payment_amount}% of ticket sales`}
                        {spot.payment_type === 'percentage_door_sales' && `${spot.payment_amount}% of door sales`}
                      </span>
                      <span className="text-green-300">
                        Est: AUD {calculatePaymentPreview(spot).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Total Payment Summary */}
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-300/20">
              <Label className="text-sm font-medium text-green-200 mb-2 block">Total Payments (Estimated)</Label>
              <div className="text-sm space-y-1">
                <p className="text-green-300">
                  Fixed Payments: AUD {spots.filter(s => s.is_paid && s.payment_type === 'flat_fee').reduce((sum, s) => sum + (s.payment_amount || 0), 0).toFixed(2)}
                </p>
                <p className="text-green-300">
                  Variable Payments: AUD {spots.filter(s => s.is_paid && s.payment_type !== 'flat_fee').reduce((sum, s) => sum + calculatePaymentPreview(s), 0).toFixed(2)}
                </p>
                <p className="text-white font-medium">
                  Total Estimated: AUD {spots.filter(s => s.is_paid).reduce((sum, s) => sum + calculatePaymentPreview(s), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
