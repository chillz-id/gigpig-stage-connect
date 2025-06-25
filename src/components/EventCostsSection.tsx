
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { Plus, X, DollarSign } from 'lucide-react';

export interface EventCost {
  cost_name: string;
  is_percentage: boolean;
  amount: number;
  currency: string;
}

interface EventCostsSectionProps {
  costs: EventCost[];
  onCostsChange: (costs: EventCost[]) => void;
}

export const EventCostsSection: React.FC<EventCostsSectionProps> = ({
  costs,
  onCostsChange
}) => {
  const [newCost, setNewCost] = useState<EventCost>({
    cost_name: '',
    is_percentage: false,
    amount: 0,
    currency: 'AUD'
  });

  const addCost = () => {
    if (newCost.cost_name.trim()) {
      onCostsChange([...costs, { ...newCost }]);
      setNewCost({
        cost_name: '',
        is_percentage: false,
        amount: 0,
        currency: 'AUD'
      });
    }
  };

  const removeCost = (index: number) => {
    onCostsChange(costs.filter((_, i) => i !== index));
  };

  const handleAmountChange = (value: string) => {
    const numericValue = parseFloat(value.replace(/^0+(?=\d)/, '') || '0');
    setNewCost(prev => ({ ...prev, amount: numericValue }));
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Event Costs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="costName">Cost Name *</Label>
            <Input
              id="costName"
              value={newCost.cost_name}
              onChange={(e) => setNewCost(prev => ({ ...prev, cost_name: e.target.value }))}
              placeholder="Venue Hire, Photographer, etc."
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
            />
          </div>
          <div>
            <Label htmlFor="costAmount">
              Cost Amount * {newCost.is_percentage ? '(%)' : `(${newCost.currency})`}
            </Label>
            <Input
              id="costAmount"
              type="number"
              step={newCost.is_percentage ? "0.1" : "0.01"}
              min="0"
              max={newCost.is_percentage ? "100" : undefined}
              value={newCost.amount === 0 ? '' : newCost.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder={newCost.is_percentage ? "10.0" : "0.00"}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
            />
          </div>
          <div>
            <Label htmlFor="costCurrency">Currency</Label>
            <CurrencySelector
              value={newCost.currency}
              onChange={(currency) => setNewCost(prev => ({ ...prev, currency }))}
              className="bg-white/10 border-white/20 text-white"
              disabled={newCost.is_percentage}
            />
          </div>
          <div className="flex flex-col justify-end">
            <div className="flex items-center space-x-2 mb-2">
              <Switch
                checked={newCost.is_percentage}
                onCheckedChange={(checked) => 
                  setNewCost(prev => ({ ...prev, is_percentage: checked }))
                }
              />
              <Label className="text-sm">
                {newCost.is_percentage ? 'Percentage' : 'Flat Amount'}
              </Label>
            </div>
            <Button 
              type="button" 
              onClick={addCost} 
              disabled={!newCost.cost_name.trim() || newCost.amount <= 0}
              className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Cost
            </Button>
          </div>
        </div>

        {/* Cost Preview */}
        {newCost.cost_name.trim() && newCost.amount > 0 && (
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-300/20">
            <Label className="text-sm font-medium text-blue-200 mb-2 block">Cost Preview</Label>
            <p className="text-white">
              {newCost.cost_name}: {newCost.is_percentage ? `${newCost.amount}%` : `${newCost.currency} ${newCost.amount.toFixed(2)}`}
            </p>
          </div>
        )}

        {costs.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Added Costs</Label>
            <div className="space-y-2">
              {costs.map((cost, index) => (
                <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-white border-white/30">
                        {cost.cost_name}
                      </Badge>
                      <span className="text-sm text-gray-300">
                        {cost.is_percentage 
                          ? `${cost.amount}% of revenue`
                          : `${cost.currency} ${cost.amount.toFixed(2)}`
                        }
                      </span>
                    </div>
                    <X 
                      className="w-4 h-4 cursor-pointer hover:text-red-300" 
                      onClick={() => removeCost(index)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total Cost Summary */}
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-300/20">
              <Label className="text-sm font-medium text-green-200 mb-2 block">Cost Summary</Label>
              <div className="text-sm space-y-1">
                <p className="text-green-300">
                  Fixed Costs: {costs.filter(c => !c.is_percentage).reduce((sum, c) => sum + c.amount, 0).toFixed(2)} AUD
                </p>
                <p className="text-green-300">
                  Variable Costs: {costs.filter(c => c.is_percentage).reduce((sum, c) => sum + c.amount, 0).toFixed(1)}% of revenue
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
