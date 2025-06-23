import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, DollarSign, GripVertical } from 'lucide-react';
import { CurrencySelector } from '@/components/ui/currency-selector';

interface EventSpot {
  spot_name: string;
  is_paid: boolean;
  payment_amount?: number;
  currency: string;
  duration_minutes?: number;
}

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
    duration_minutes: 5
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
        duration_minutes: 5
      });
    }
  };

  const removeSpot = (index: number) => {
    onSpotsChange(spots.filter((_, i) => i !== index));
  };

  const updateSpot = (index: number, updates: Partial<EventSpot>) => {
    const updatedSpots = spots.map((spot, i) => 
      i === index ? { ...spot, ...updates } : spot
    );
    onSpotsChange(updatedSpots);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updatedSpots = [...spots];
    const draggedSpot = updatedSpots[draggedIndex];
    updatedSpots.splice(draggedIndex, 1);
    updatedSpots.splice(dropIndex, 0, draggedSpot);
    
    onSpotsChange(updatedSpots);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Event Spots Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Spot */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Add New Spot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="spot-name">Spot Name</Label>
                <Input
                  id="spot-name"
                  value={newSpot.spot_name}
                  onChange={(e) => setNewSpot(prev => ({ ...prev, spot_name: e.target.value }))}
                  placeholder="e.g., Opening Act, Headliner"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newSpot.duration_minutes}
                  onChange={(e) => setNewSpot(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 5 }))}
                  className="bg-white/10 border-white/20 text-white"
                  min="1"
                  max="60"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label htmlFor="is-paid">Paid Spot</Label>
              {newSpot.is_paid && (
                <Badge className="bg-green-500 text-xs">
                  <DollarSign className="w-3 h-3 mr-1" />
                  {newSpot.currency}
                </Badge>
              )}
              <Switch
                id="is-paid"
                checked={newSpot.is_paid}
                onCheckedChange={(checked) => setNewSpot(prev => ({ ...prev, is_paid: checked }))}
              />
            </div>

            {newSpot.is_paid && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment-amount">Payment Amount</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    value={newSpot.payment_amount}
                    onChange={(e) => setNewSpot(prev => ({ ...prev, payment_amount: parseFloat(e.target.value) || 0 }))}
                    className="bg-white/10 border-white/20 text-white"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <CurrencySelector
                    value={newSpot.currency}
                    onChange={(currency) => setNewSpot(prev => ({ ...prev, currency }))}
                    className="bg-white/10 border-white/20 text-white w-full"
                  />
                </div>
              </div>
            )}

            <Button 
              type="button" 
              onClick={addSpot}
              disabled={!newSpot.spot_name.trim()}
              className="w-full bg-purple-500 hover:bg-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Spot
            </Button>
          </CardContent>
        </Card>

        {/* Existing Spots */}
        {spots.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Current Spots ({spots.length})</h4>
            {spots.map((spot, index) => (
              <Card 
                key={index} 
                className={`bg-white/5 border-white/10 transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="cursor-move p-1 hover:bg-white/10 rounded">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium">{spot.spot_name}</h5>
                        <Badge variant="outline" className="text-xs">
                          {spot.duration_minutes}min
                        </Badge>
                        {spot.is_paid && (
                          <Badge className="bg-green-500 text-xs">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {spot.currency} {spot.payment_amount}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <Input
                          value={spot.spot_name}
                          onChange={(e) => updateSpot(index, { spot_name: e.target.value })}
                          className="bg-white/10 border-white/20 text-white text-sm"
                          placeholder="Spot name"
                        />
                        <Input
                          type="number"
                          value={spot.duration_minutes}
                          onChange={(e) => updateSpot(index, { duration_minutes: parseInt(e.target.value) || 5 })}
                          className="bg-white/10 border-white/20 text-white text-sm"
                          min="1"
                          max="60"
                        />
                        {spot.is_paid && (
                          <>
                            <Input
                              type="number"
                              value={spot.payment_amount}
                              onChange={(e) => updateSpot(index, { payment_amount: parseFloat(e.target.value) || 0 })}
                              className="bg-white/10 border-white/20 text-white text-sm"
                              min="0"
                              step="0.01"
                              placeholder="Amount"
                            />
                            <CurrencySelector
                              value={spot.currency}
                              onChange={(currency) => updateSpot(index, { currency })}
                              className="bg-white/10 border-white/20 text-white text-sm w-full"
                            />
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-300">Paid</span>
                        <Switch
                          checked={spot.is_paid}
                          onCheckedChange={(checked) => updateSpot(index, { is_paid: checked })}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeSpot(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {spots.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No spots added yet. Create your first spot above!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
