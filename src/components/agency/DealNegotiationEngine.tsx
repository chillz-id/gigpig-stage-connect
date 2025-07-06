import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  MessageSquare, 
  DollarSign, 
  TrendingUp, 
  Brain,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Target,
  BarChart3,
  Settings
} from 'lucide-react';
import {
  useDeal,
  useDealMessages,
  useSendDealMessage,
  useUpdateDealStatus,
  useCalculateNegotiationStrategy,
  useProcessAutomatedResponse
} from '../../hooks/useAgency';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { DealNegotiation, DealMessage, DealStatus, NegotiationStrategy } from '../../types/agency';
import LoadingSpinner from '../LoadingSpinner';

interface DealNegotiationEngineProps {
  dealId: string;
  onClose?: () => void;
}

const DealNegotiationEngine: React.FC<DealNegotiationEngineProps> = ({ dealId, onClose }) => {
  const [message, setMessage] = useState('');
  const [offerAmount, setOfferAmount] = useState<number | undefined>();
  const [messageType, setMessageType] = useState<'text' | 'offer' | 'counter_offer'>('text');
  const [showStrategy, setShowStrategy] = useState(false);
  const [autoResponseEnabled, setAutoResponseEnabled] = useState(false);

  const { data: deal, isLoading: dealLoading } = useDeal(dealId);
  const { data: messages, isLoading: messagesLoading } = useDealMessages(dealId);
  const sendMessageMutation = useSendDealMessage();
  const updateStatusMutation = useUpdateDealStatus();
  const calculateStrategyMutation = useCalculateNegotiationStrategy();
  const processAutomatedResponseMutation = useProcessAutomatedResponse();

  useEffect(() => {
    if (deal) {
      setAutoResponseEnabled(deal.automated_responses || false);
    }
  }, [deal]);

  if (dealLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!deal) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>Deal not found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSendMessage = async () => {
    if (!message.trim() && messageType === 'text') return;
    if ((messageType === 'offer' || messageType === 'counter_offer') && !offerAmount) return;

    try {
      await sendMessageMutation.mutateAsync({
        deal_id: dealId,
        message_type: messageType,
        content: message || `${messageType === 'offer' ? 'Offer' : 'Counter-offer'}: ${formatCurrency(offerAmount || 0)}`,
        offer_amount: offerAmount,
        offer_terms: {}
      });

      setMessage('');
      setOfferAmount(undefined);
      setMessageType('text');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleStatusUpdate = async (status: DealStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: dealId,
        statusUpdate: { status }
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCalculateStrategy = async () => {
    try {
      await calculateStrategyMutation.mutateAsync({
        dealId,
        marketData: {} // Could include external market data
      });
      setShowStrategy(true);
    } catch (error) {
      console.error('Error calculating strategy:', error);
    }
  };

  const handleToggleAutoResponse = async () => {
    const newValue = !autoResponseEnabled;
    setAutoResponseEnabled(newValue);
    
    try {
      await updateStatusMutation.mutateAsync({
        id: dealId,
        statusUpdate: { automated_responses: newValue }
      });
    } catch (error) {
      console.error('Error updating auto-response setting:', error);
      setAutoResponseEnabled(!newValue); // Revert on error
    }
  };

  const getStatusColor = (status: DealStatus) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'negotiating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'counter_offered': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'proposed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMessageTypeColor = (type: DealMessage['message_type']) => {
    switch (type) {
      case 'offer': return 'bg-green-100 text-green-800';
      case 'counter_offer': return 'bg-yellow-100 text-yellow-800';
      case 'acceptance': return 'bg-green-100 text-green-800';
      case 'rejection': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const strategy = deal.negotiation_strategy as NegotiationStrategy | undefined;

  return (
    <div className="space-y-6">
      {/* Deal Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{deal.title}</CardTitle>
              <p className="text-gray-600 mt-1">{deal.artist?.stage_name} • {deal.event?.title}</p>
            </div>
            <div className="text-right">
              <Badge className={getStatusColor(deal.status)}>
                {deal.status}
              </Badge>
              <p className="text-2xl font-bold mt-1">{formatCurrency(deal.proposed_fee || 0)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Performance Date</p>
              <p className="text-lg">{deal.performance_date ? formatDate(deal.performance_date) : 'TBD'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Duration</p>
              <p className="text-lg">{deal.performance_duration || 'TBD'} minutes</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Deadline</p>
              <p className="text-lg">{deal.deadline ? formatDate(deal.deadline) : 'No deadline'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Negotiation Strategy */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Strategy
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCalculateStrategy}
                  disabled={calculateStrategyMutation.isPending}
                >
                  {calculateStrategyMutation.isPending ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Calculate
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {strategy ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Recommended Range</p>
                    <div className="mt-1">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(strategy.recommended_target || 0)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Min: {formatCurrency(strategy.recommended_minimum || 0)} • 
                        Max: {formatCurrency(strategy.recommended_maximum || 0)}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Approach</p>
                    <Badge className="mt-1 capitalize">
                      {strategy.negotiation_approach}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Artist Experience</p>
                    <p className="text-sm mt-1 capitalize">
                      {strategy.artist_metrics?.experience_level} 
                      ({strategy.artist_metrics?.total_bookings} bookings)
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Market Position</p>
                    <p className="text-sm mt-1 capitalize">
                      {strategy.market_data?.market_position}
                      <br />
                      Market avg: {formatCurrency(strategy.market_data?.market_average || 0)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4" />
                  <p>Click Calculate to generate AI-powered negotiation strategy</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Automation Settings */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-Response</p>
                    <p className="text-sm text-gray-600">Automatically respond to offers</p>
                  </div>
                  <Switch
                    checked={autoResponseEnabled}
                    onCheckedChange={handleToggleAutoResponse}
                  />
                </div>
                
                {autoResponseEnabled && strategy?.auto_response_thresholds && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Auto-accept above {formatCurrency(strategy.auto_response_thresholds.auto_accept_above)}
                      <br />
                      Auto-decline below {formatCurrency(strategy.auto_response_thresholds.auto_decline_below)}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages & Communication */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Negotiation Thread
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate('accepted')}
                    disabled={deal.status === 'accepted'}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate('declined')}
                    disabled={deal.status === 'declined'}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Messages List */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {msg.sender?.name?.charAt(0) || 'U'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{msg.sender?.name || 'Unknown'}</p>
                          <Badge className={`${getMessageTypeColor(msg.message_type)} text-xs`}>
                            {msg.message_type}
                          </Badge>
                          {msg.is_automated && (
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Auto
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">{formatDate(msg.created_at)}</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm">{msg.content}</p>
                          {msg.offer_amount && (
                            <p className="font-bold text-lg mt-2 text-green-600">
                              {formatCurrency(msg.offer_amount)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                    <p>No messages yet. Start the negotiation!</p>
                  </div>
                )}
              </div>

              <Separator className="mb-6" />

              {/* Message Composer */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={messageType === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageType('text')}
                  >
                    Message
                  </Button>
                  <Button
                    variant={messageType === 'offer' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageType('offer')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Offer
                  </Button>
                  <Button
                    variant={messageType === 'counter_offer' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageType('counter_offer')}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Counter
                  </Button>
                </div>

                {(messageType === 'offer' || messageType === 'counter_offer') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount</label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={offerAmount || ''}
                      onChange={(e) => setOfferAmount(parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <Textarea
                    placeholder={
                      messageType === 'text' 
                        ? "Type your message..." 
                        : "Add notes to your offer (optional)"
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={
                    sendMessageMutation.isPending ||
                    (!message.trim() && messageType === 'text') ||
                    ((messageType === 'offer' || messageType === 'counter_offer') && !offerAmount)
                  }
                  className="w-full"
                >
                  {sendMessageMutation.isPending ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send {messageType === 'text' ? 'Message' : messageType.replace('_', ' ')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DealNegotiationEngine;