/**
 * SpotPaymentEditor Component (Presentational)
 *
 * Form for editing spot payment details with live tax breakdown preview
 */

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DollarSign, Info } from 'lucide-react';
import { calculateTaxBreakdown } from '@/hooks/useSpotPayments';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const paymentFormSchema = z.object({
  payment_amount: z.coerce
    .number({ required_error: 'Payment amount is required' })
    .positive('Payment amount must be positive')
    .min(0.01, 'Payment amount must be at least $0.01'),
  tax_included: z.boolean().default(true),
  tax_rate: z.coerce
    .number()
    .min(0, 'Tax rate must be at least 0%')
    .max(100, 'Tax rate must be at most 100%')
    .default(10),
  payment_status: z.enum(['unpaid', 'pending', 'paid', 'partially_paid', 'refunded']).default('unpaid'),
  payment_notes: z.string().optional()
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export interface PaymentUpdate {
  payment_amount: number;
  tax_included: boolean;
  tax_rate: number;
  payment_notes?: string;
  payment_status: 'unpaid' | 'pending' | 'paid' | 'partially_paid' | 'refunded';
}

export interface SpotPaymentData {
  id: string;
  payment_amount?: number;
  tax_included?: boolean;
  tax_rate?: number;
  payment_notes?: string;
  payment_status?: 'unpaid' | 'pending' | 'paid' | 'partially_paid' | 'refunded';
}

interface SpotPaymentEditorProps {
  spot: SpotPaymentData;
  onSave: (payment: PaymentUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SpotPaymentEditor({
  spot,
  onSave,
  onCancel,
  isLoading = false
}: SpotPaymentEditorProps) {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      payment_amount: spot.payment_amount || 0,
      tax_included: spot.tax_included ?? true,
      tax_rate: spot.tax_rate ?? 10,
      payment_status: spot.payment_status || 'unpaid',
      payment_notes: spot.payment_notes || ''
    }
  });

  // Watch form values for live tax calculation
  const watchedAmount = form.watch('payment_amount');
  const watchedTaxIncluded = form.watch('tax_included');
  const watchedTaxRate = form.watch('tax_rate');

  // Calculate tax breakdown in real-time
  const taxBreakdown = useMemo(() => {
    if (!watchedAmount || watchedAmount <= 0) {
      return { gross: 0, net: 0, tax: 0 };
    }
    return calculateTaxBreakdown(watchedAmount, watchedTaxIncluded, watchedTaxRate);
  }, [watchedAmount, watchedTaxIncluded, watchedTaxRate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const onSubmit = (values: PaymentFormValues) => {
    onSave({
      payment_amount: values.payment_amount,
      tax_included: values.tax_included,
      tax_rate: values.tax_rate,
      payment_status: values.payment_status,
      payment_notes: values.payment_notes
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Payment Amount */}
        <FormField
          control={form.control}
          name="payment_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-9"
                    disabled={isLoading}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Base payment amount {watchedTaxIncluded ? '(includes tax)' : '(excludes tax)'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tax Settings */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Tax Included Toggle */}
          <FormField
            control={form.control}
            name="tax_included"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Tax Included</FormLabel>
                  <FormDescription>
                    Amount includes tax
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    aria-label="Toggle tax included"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Tax Rate */}
          <FormField
            control={form.control}
            name="tax_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="10"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Tax percentage (0-100%)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tax Breakdown Preview */}
        {watchedAmount > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-500" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Tax Breakdown
              </h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Gross Amount:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(taxBreakdown.gross)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Net Amount:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(taxBreakdown.net)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Tax ({watchedTaxRate}%):</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(taxBreakdown.tax)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Status */}
        <FormField
          control={form.control}
          name="payment_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Notes */}
        <FormField
          control={form.control}
          name="payment_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any payment notes or instructions..."
                  className="min-h-[80px] resize-none"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Internal notes about this payment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Payment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default SpotPaymentEditor;
