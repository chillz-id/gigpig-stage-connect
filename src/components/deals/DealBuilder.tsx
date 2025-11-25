/**
 * DealBuilder Component (Presentational)
 *
 * Multi-step wizard for creating event deals with participant management
 */

import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  DollarSign,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

export type DealType = 'revenue_share' | 'fixed_split' | 'tiered' | 'custom';
export type SplitType = 'percentage' | 'fixed_amount';

export interface DealParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  split_type: SplitType;
  split_percentage?: number;
  split_amount?: number;
}

export interface DealInput {
  deal_name: string;
  deal_type: DealType;
  description?: string;
  total_amount?: number;
  participants: DealParticipant[];
}

const dealBasicsSchema = z.object({
  deal_name: z.string().min(3, 'Deal name must be at least 3 characters'),
  deal_type: z.enum(['revenue_share', 'fixed_split', 'tiered', 'custom']),
  description: z.string().optional(),
  total_amount: z.coerce.number().positive('Total amount must be positive').optional()
});

type DealBasicsValues = z.infer<typeof dealBasicsSchema>;

interface DealBuilderProps {
  onComplete: (deal: DealInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DealBuilder({ onComplete, onCancel, isLoading = false }: DealBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [dealBasics, setDealBasics] = useState<DealBasicsValues | null>(null);
  const [participants, setParticipants] = useState<DealParticipant[]>([]);
  const { isMobile, isSmallMobile } = useMobileLayout();

  const form = useForm<DealBasicsValues>({
    resolver: zodResolver(dealBasicsSchema),
    defaultValues: {
      deal_name: '',
      deal_type: 'revenue_share',
      description: '',
      total_amount: undefined
    }
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // ============================================================================
  // STEP 1: DEAL BASICS
  // ============================================================================

  const handleBasicsSubmit = (values: DealBasicsValues) => {
    setDealBasics(values);
    setCurrentStep(2);
  };

  // ============================================================================
  // STEP 2: ADD PARTICIPANTS (Placeholder - real implementation would search)
  // ============================================================================

  const handleAddParticipant = () => {
    // Placeholder: Add a mock participant
    const newParticipant: DealParticipant = {
      id: `participant-${Date.now()}`,
      name: 'Participant ' + (participants.length + 1),
      role: 'Comedian',
      split_type: 'percentage',
      split_percentage: 0
    };
    setParticipants([...participants, newParticipant]);
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  // ============================================================================
  // STEP 3: CONFIGURE SPLITS
  // ============================================================================

  const handleSplitChange = (id: string, field: keyof DealParticipant, value: any) => {
    setParticipants(
      participants.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  const totalPercentage = participants.reduce(
    (sum, p) => sum + (p.split_type === 'percentage' ? (p.split_percentage || 0) : 0),
    0
  );

  const isValidSplits = Math.abs(totalPercentage - 100) < 0.01 && participants.length > 0;

  // ============================================================================
  // STEP 4: REVIEW & CREATE
  // ============================================================================

  const handleCreate = () => {
    if (!dealBasics) return;

    const dealInput: DealInput = {
      deal_name: dealBasics.deal_name,
      deal_type: dealBasics.deal_type,
      description: dealBasics.description,
      total_amount: dealBasics.total_amount,
      participants
    };

    onComplete(dealInput);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className={cn(
          "max-h-[90vh] overflow-y-auto",
          isMobile ? "max-w-full" : "max-w-2xl"
        )}
        mobileVariant="fullscreen"
      >
        <DialogHeader>
          <DialogTitle className={cn(isMobile && "text-lg")}>Create New Deal</DialogTitle>
          <DialogDescription>
            Step {currentStep} of {totalSteps}
          </DialogDescription>
          <Progress value={progress} className="mt-2" />
        </DialogHeader>

        <div className={cn("space-y-6", isMobile ? "py-2" : "py-4")}>
          {/* STEP 1: Deal Basics */}
          {currentStep === 1 && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleBasicsSubmit)} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className={cn(isMobile ? "h-6 w-6" : "h-5 w-5", "text-blue-500")} />
                  <h3 className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>Deal Basics</h3>
                </div>

                <FormField
                  control={form.control}
                  name="deal_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Sydney Comedy Night Split"
                          className={cn(isMobile && "h-11 touch-target-44")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deal_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className={cn(isMobile && "h-11 touch-target-44")}>
                            <SelectValue placeholder="Select deal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="revenue_share">Revenue Share</SelectItem>
                          <SelectItem value="fixed_split">Fixed Split</SelectItem>
                          <SelectItem value="tiered">Tiered</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="total_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500",
                            isMobile ? "h-5 w-5" : "h-4 w-4"
                          )} />
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            placeholder="0.00"
                            className={cn("pl-9", isMobile && "h-11 touch-target-44")}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Leave empty for percentage-based deals
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add details about this deal..."
                          className={cn("resize-none", isMobile && "min-h-[100px]")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mobile: Stack buttons, Desktop: Side by side */}
                <div className={cn(
                  "pt-4",
                  isMobile ? "flex flex-col gap-2" : "flex justify-end gap-2"
                )}>
                  {isMobile ? (
                    <>
                      <Button type="submit" className="w-full touch-target-44">
                        Next <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                      <Button type="button" variant="outline" className="w-full touch-target-44" onClick={onCancel}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" className="professional-button" onClick={onCancel}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </Form>
          )}

          {/* STEP 2: Add Participants */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className={cn(isMobile ? "h-6 w-6" : "h-5 w-5", "text-blue-500")} />
                <h3 className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>Add Participants</h3>
              </div>

              <Alert>
                <AlertCircle className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
                <AlertDescription className={cn(isMobile && "text-sm")}>
                  This is a simplified demo. In the real implementation, you would search and select participants.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleAddParticipant}
                className={cn("professional-button w-full", isMobile && "h-11 touch-target-44")}
              >
                Add Participant
              </Button>

              {participants.length > 0 && (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={cn(
                        "flex items-center justify-between rounded-lg border",
                        isMobile ? "p-4 flex-col gap-3" : "p-3"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className={cn(isMobile ? "h-12 w-12" : "h-10 w-10")}>
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          <p className={cn("text-gray-500", isMobile ? "text-sm" : "text-sm")}>{participant.role}</p>
                        </div>
                      </div>
                      <Button
                        variant={isMobile ? "outline" : "ghost"}
                        size={isMobile ? "default" : "sm"}
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className={cn(isMobile && "w-full touch-target-44")}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Mobile: Stack buttons, Desktop: Side by side */}
              <div className={cn(
                "pt-4",
                isMobile ? "flex flex-col gap-2" : "flex justify-between gap-2"
              )}>
                {isMobile ? (
                  <>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      disabled={participants.length === 0}
                      className="w-full touch-target-44"
                    >
                      Next <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button variant="outline" className="w-full touch-target-44" onClick={() => setCurrentStep(1)}>
                      <ChevronLeft className="mr-2 h-5 w-5" /> Back
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="professional-button" onClick={() => setCurrentStep(1)}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      disabled={participants.length === 0}
                    >
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Configure Splits */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className={cn(isMobile ? "h-6 w-6" : "h-5 w-5", "text-blue-500")} />
                <h3 className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>Configure Splits</h3>
              </div>

              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className={cn(
                    "rounded-lg border space-y-3",
                    isMobile ? "p-3" : "p-4"
                  )}>
                    <div className="flex items-center gap-3">
                      <Avatar className={cn(isMobile ? "h-10 w-10" : "h-8 w-8")}>
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{participant.name}</p>
                      </div>
                    </div>

                    {/* Mobile: Stack fields, Desktop: Grid */}
                    <div className={cn(
                      "gap-3",
                      isMobile ? "flex flex-col" : "grid grid-cols-2"
                    )}>
                      <div>
                        <label className="text-sm font-medium">Split Type</label>
                        <Select
                          value={participant.split_type}
                          onValueChange={(value) =>
                            handleSplitChange(participant.id, 'split_type', value)
                          }
                        >
                          <SelectTrigger className={cn("mt-1", isMobile && "h-11 touch-target-44")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          {participant.split_type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                        </label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step={participant.split_type === 'percentage' ? '0.1' : '0.01'}
                          className={cn("mt-1", isMobile && "h-11 touch-target-44")}
                          value={
                            participant.split_type === 'percentage'
                              ? participant.split_percentage || 0
                              : participant.split_amount || 0
                          }
                          onChange={(e) =>
                            handleSplitChange(
                              participant.id,
                              participant.split_type === 'percentage'
                                ? 'split_percentage'
                                : 'split_amount',
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Validation */}
              <div className={cn(
                "rounded-lg border bg-gray-50 dark:bg-gray-800",
                isMobile ? "p-3" : "p-4"
              )}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Percentage:</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-bold",
                      isValidSplits ? 'text-green-600' : 'text-red-600',
                      isMobile && "text-lg"
                    )}>
                      {totalPercentage.toFixed(1)}%
                    </span>
                    {isValidSplits ? (
                      <CheckCircle className={cn(isMobile ? "h-6 w-6" : "h-5 w-5", "text-green-600")} />
                    ) : (
                      <AlertCircle className={cn(isMobile ? "h-6 w-6" : "h-5 w-5", "text-red-600")} />
                    )}
                  </div>
                </div>
                {!isValidSplits && (
                  <p className="text-sm text-red-600 mt-2">
                    Total percentage must equal 100%
                  </p>
                )}
              </div>

              {/* Mobile: Stack buttons, Desktop: Side by side */}
              <div className={cn(
                "pt-4",
                isMobile ? "flex flex-col gap-2" : "flex justify-between gap-2"
              )}>
                {isMobile ? (
                  <>
                    <Button
                      onClick={() => setCurrentStep(4)}
                      disabled={!isValidSplits}
                      className="w-full touch-target-44"
                    >
                      Next <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button variant="outline" className="w-full touch-target-44" onClick={() => setCurrentStep(2)}>
                      <ChevronLeft className="mr-2 h-5 w-5" /> Back
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="professional-button" onClick={() => setCurrentStep(2)}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button onClick={() => setCurrentStep(4)} disabled={!isValidSplits}>
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {currentStep === 4 && dealBasics && (
            <div className="space-y-4">
              <div className={cn("flex items-center gap-2", isMobile ? "mb-3" : "mb-4")}>
                <CheckCircle className={cn(isMobile ? "h-6 w-6" : "h-5 w-5", "text-blue-500")} />
                <h3 className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>Review & Create</h3>
              </div>

              <div className={cn(isMobile ? "space-y-3" : "space-y-4")}>
                {/* Deal Details */}
                <div className={cn("rounded-lg border space-y-2", isMobile ? "p-3" : "p-4")}>
                  <h4 className={cn("font-medium", isMobile && "text-sm")}>Deal Details</h4>
                  <div className={cn("space-y-1", isMobile ? "text-sm" : "text-sm")}>
                    <div className={cn("flex justify-between", isMobile && "py-1")}>
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium truncate ml-2 max-w-[60%] text-right">{dealBasics.deal_name}</span>
                    </div>
                    <div className={cn("flex justify-between items-center", isMobile && "py-1")}>
                      <span className="text-gray-600">Type:</span>
                      <Badge className="professional-button">{dealBasics.deal_type}</Badge>
                    </div>
                    <div className={cn("flex justify-between", isMobile && "py-1")}>
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium">{formatCurrency(dealBasics.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div className={cn("rounded-lg border", isMobile ? "p-3 space-y-2" : "p-4 space-y-3")}>
                  <h4 className={cn("font-medium", isMobile && "text-sm")}>Participants ({participants.length})</h4>
                  <div className={cn(isMobile ? "space-y-3" : "space-y-2")}>
                    {participants.map((p) => (
                      <div
                        key={p.id}
                        className={cn(
                          "flex items-center justify-between",
                          isMobile ? "py-2 border-b last:border-b-0" : "text-sm"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Avatar className={cn(isMobile ? "h-8 w-8" : "h-6 w-6")}>
                            <AvatarImage src={p.avatar} />
                            <AvatarFallback className={cn(isMobile ? "text-sm" : "text-xs")}>{getInitials(p.name)}</AvatarFallback>
                          </Avatar>
                          <span className={cn("truncate", isMobile && "text-sm")}>{p.name}</span>
                        </div>
                        <span className={cn("font-medium flex-shrink-0 ml-2", isMobile ? "text-base" : "text-sm")}>
                          {p.split_type === 'percentage'
                            ? `${p.split_percentage}%`
                            : formatCurrency(p.split_amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={cn("pt-4", isMobile ? "flex flex-col gap-2" : "flex justify-between gap-2")}>
                {isMobile ? (
                  <>
                    <Button
                      onClick={handleCreate}
                      disabled={isLoading}
                      className="w-full touch-target-44"
                    >
                      {isLoading ? 'Creating...' : 'Create Deal'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full touch-target-44"
                      onClick={() => setCurrentStep(3)}
                    >
                      <ChevronLeft className="mr-2 h-5 w-5" /> Back
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="professional-button" onClick={() => setCurrentStep(3)}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button onClick={handleCreate} disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Deal'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DealBuilder;
