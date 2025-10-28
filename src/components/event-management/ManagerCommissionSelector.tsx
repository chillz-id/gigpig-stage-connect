import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface ManagerCommissionSelectorProps {
  defaultRate?: number; // 0-30, from manager profile
  amount: number; // Total amount to calculate commission from
  onSelect: (rate: number) => void;
  disabled?: boolean;
}

export function ManagerCommissionSelector({
  defaultRate = 0,
  amount,
  onSelect,
  disabled = false,
}: ManagerCommissionSelectorProps) {
  const [rate, setRate] = useState<number>(defaultRate);
  const [inputValue, setInputValue] = useState<string>(defaultRate.toString());
  const [error, setError] = useState<string>('');

  // Sync rate with defaultRate when it changes
  useEffect(() => {
    setRate(defaultRate);
    setInputValue(defaultRate.toString());
  }, [defaultRate]);

  // Calculate commission and net amounts
  const commissionAmount = (amount * rate) / 100;
  const netAmount = amount - commissionAmount;

  // Format currency with 2 decimal places
  const formatCurrency = (value: number): string => {
    return value.toFixed(2);
  };

  // Handle slider change
  const handleSliderChange = (values: number[]) => {
    const newRate = values[0];
    if (newRate !== undefined) {
      setRate(newRate);
      setInputValue(newRate.toString());
      setError('');
      onSelect(newRate);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Allow empty input for user to type
    if (value === '') {
      setError('');
      return;
    }

    // Check if input is numeric
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      setError('Please enter a valid number');
      return;
    }

    // Validate range
    if (numericValue < 0) {
      setError('Rate cannot be less than 0%');
      return;
    }

    if (numericValue > 30) {
      setError('Rate cannot exceed 30%');
      return;
    }

    // Valid input - update rate and clear error
    setRate(numericValue);
    setError('');
    onSelect(numericValue);
  };

  // Handle input blur - ensure valid value
  const handleInputBlur = () => {
    if (inputValue === '') {
      setInputValue('0');
      setRate(0);
      onSelect(0);
      setError('');
      return;
    }

    const numericValue = parseFloat(inputValue);
    if (isNaN(numericValue) || numericValue < 0) {
      setInputValue('0');
      setRate(0);
      onSelect(0);
      setError('');
    } else if (numericValue > 30) {
      setInputValue('30');
      setRate(30);
      onSelect(30);
      setError('');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Manager Commission Rate</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Manager commission is 0-30% of your payment</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {defaultRate > 0 && (
            <span className="text-sm text-muted-foreground">(Default: {defaultRate}%)</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Slider Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="commission-slider" className="text-sm">
              Adjust Rate
            </Label>
            <span className="text-sm font-medium">{rate}%</span>
          </div>
          <Slider
            id="commission-slider"
            value={[rate]}
            onValueChange={handleSliderChange}
            min={0}
            max={30}
            step={0.5}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Input Control */}
        <div className="space-y-2">
          <Label htmlFor="commission-input" className="text-sm">
            Precise Entry (%)
          </Label>
          <Input
            id="commission-input"
            type="number"
            min="0"
            max="30"
            step="0.1"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            disabled={disabled}
            placeholder="0"
            className={error ? 'border-red-500' : ''}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Live Preview */}
        <div className="space-y-2 rounded-lg bg-muted p-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Commission:</span>
            <span className="text-sm font-medium text-red-600">
              ${formatCurrency(commissionAmount)}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-sm font-semibold">Your net:</span>
            <span className="text-sm font-bold text-green-600">
              ${formatCurrency(netAmount)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
