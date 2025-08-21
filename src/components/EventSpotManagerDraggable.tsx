
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Users, Clock, GripVertical } from 'lucide-react';
import { EventSpot } from '@/types/eventTypes';

interface EventSpotManagerDraggableProps {
  spots: EventSpot[];
  onSpotsChange: (spots: EventSpot[]) => void;
}

export const EventSpotManagerDraggable: React.FC<EventSpotManagerDraggableProps> = ({
  spots,
  onSpotsChange
}) => {
  const [newSpot, setNewSpot] = useState<EventSpot>({
    spot_name: '',
    is_paid: false,
    payment_amount: 0,
    currency: 'AUD',
    duration_minutes: 10,
    payment_type: 'flat_fee'
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addSpot = () => {
    if (newSpot.spot_name.trim()) {
      onSpotsChange([...spots, { ...newSpot }]);
      setNewSpot({
        spot_name: '',
        is_paid: false,
        payment_amount: 0,
        currency: 'AUD',
        duration_minutes: 10,
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newSpots = [...spots];
    const draggedSpot = newSpots[draggedIndex];
    
    // Remove the dragged item
    newSpots.splice(draggedIndex, 1);
    
    // Insert at new position
    newSpots.splice(dropIndex, 0, draggedSpot);
    
    onSpotsChange(newSpots);
    setDraggedIndex(null);
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
              onChange={(e) => setNewSpot(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 10 }))}
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
        </div>

        {newSpot.is_paid && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

            {newSpot.payment_amount > 0 && (
              <div className="flex items-end">
                <div className="text-sm">
                  <Label className="text-green-300">Estimated Payment</Label>
                  <p className="text-green-400 font-medium">
                    AUD {calculatePaymentPreview(newSpot).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
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
                <div 
                  key={index} 
                  className="p-3 bg-white/5 rounded-lg border border-white/10 cursor-move hover:bg-white/10 transition-colors"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-gray-400" />
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
                    <div className="flex justify-between text-xs ml-7">
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
