import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, DollarSign, Clock } from 'lucide-react';

interface EventSpot {
  id?: string;
  spot_name: string;
  is_paid: boolean;
  payment_amount?: number;
  currency: string;
  duration_minutes?: number;
}

interface EventSpotManagerProps {
  spots: EventSpot[];
  onSpotsChange: (spots: EventSpot[]) => void;
}

export const EventSpotManager: React.FC<EventSpotManagerProps> = ({ spots, onSpotsChange }) => {
  const [newSpot, setNewSpot] = useState<EventSpot>({
    spot_name: '',
    is_paid: false,
    payment_amount: 0,
    currency: 'USD',
    duration_minutes: 5
  });

  const addSpot = () => {
    if (newSpot.spot_name.trim()) {
      onSpotsChange([...spots, { ...newSpot, id: crypto.randomUUID() }]);
      setNewSpot({
        spot_name: '',
        is_paid: false,
        payment_amount: 0,
        currency: 'USD',
        duration_minutes: 5
      });
    }
  };

  const removeSpot = (index: number) => {
    const updatedSpots = spots.filter((_, i) => i !== index);
    onSpotsChange(updatedSpots);
  };

  const updateSpot = (index: number, field: keyof EventSpot, value: any) => {
    const updatedSpots = spots.map((spot, i) => 
      i === index ? { ...spot, [field]: value } : spot
    );
    onSpotsChange(updatedSpots);
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Spot Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Spot */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-white/5 rounded-lg">
          <div className="md:col-span-2">
            <Label htmlFor="spotName">Spot Name</Label>
            <Input
              id="spotName"
              value={newSpot.spot_name}
              onChange={(e) => setNewSpot(prev => ({ ...prev, spot_name: e.target.value }))}
              placeholder="e.g., Opening Act"
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
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <Switch
              checked={newSpot.is_paid}
              onCheckedChange={(checked) => setNewSpot(prev => ({ ...prev, is_paid: checked }))}
            />
            <Label>Paid</Label>
          </div>

          {newSpot.is_paid && (
            <>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newSpot.payment_amount}
                  onChange={(e) => setNewSpot(prev => ({ ...prev, payment_amount: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={newSpot.currency} onValueChange={(value) => setNewSpot(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex items-end">
            <Button type="button" onClick={addSpot} className="bg-purple-500 hover:bg-purple-600">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Existing Spots */}
        {spots.length > 0 && (
          <div className="space-y-2">
            <Label>Event Spots ({spots.length})</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {spots.map((spot, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className="professional-button text-white border-white/30">
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{spot.spot_name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock className="w-3 h-3" />
                        <span>{spot.duration_minutes}min</span>
                        {spot.is_paid && (
                          <>
                            <DollarSign className="w-3 h-3" />
                            <span>{spot.currency} {spot.payment_amount}</span>
                          </>
                        )}
                        {!spot.is_paid && <span className="text-green-400">Free</span>}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="professional-button"
                    size="sm"
                    onClick={() => removeSpot(index)}
                    className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
