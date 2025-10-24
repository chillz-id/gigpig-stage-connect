import { useParams, useNavigate } from "react-router-dom";
import { useDeal, useDealMessages } from "@/hooks/useAgency";
import DealNegotiationEngine from "@/components/agency/DealNegotiationEngine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Building,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();

  const { data: deal, isLoading: dealLoading, error: dealError } = useDeal(dealId || "");
  const { data: messages, isLoading: messagesLoading } = useDealMessages(dealId || "");

  if (dealLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (dealError || !deal) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <p>Deal not found or error loading deal details</p>
        </div>
        <Button onClick={() => navigate("/deals")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pipeline
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "declined":
        return "bg-red-100 text-red-800 border-red-200";
      case "negotiating":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "counter_offered":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "proposed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "declined":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "negotiating":
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case "counter_offered":
        return <TrendingUp className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const artistName = deal.artist
    ? deal.artist.stage_name || `${deal.artist.first_name} ${deal.artist.last_name}`
    : "Unknown Artist";

  const promoterName = deal.promoter
    ? `${deal.promoter.first_name} ${deal.promoter.last_name}`
    : "Unknown Promoter";

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/deals")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{deal.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge className={getStatusColor(deal.status)}>
                {getStatusIcon(deal.status)}
                <span className="ml-2 capitalize">{deal.status.replace("_", " ")}</span>
              </Badge>
              <span className="text-muted-foreground">
                Created {formatDate(deal.created_at)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Proposed Fee</p>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(deal.proposed_fee || 0)}
          </p>
        </div>
      </div>

      {/* Deal Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Artist */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Artist</span>
              </div>
              <p className="font-semibold">{artistName}</p>
            </div>

            {/* Event */}
            {deal.event && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span className="text-sm font-medium">Event</span>
                </div>
                <p className="font-semibold">{deal.event.title}</p>
              </div>
            )}

            {/* Performance Date */}
            {deal.performance_date && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Performance Date</span>
                </div>
                <p className="font-semibold">
                  {formatDate(deal.performance_date)}
                </p>
              </div>
            )}

            {/* Duration */}
            {deal.performance_duration && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Duration</span>
                </div>
                <p className="font-semibold">{deal.performance_duration} minutes</p>
              </div>
            )}
          </div>

          {deal.deadline && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">
                  Deadline: <strong>{formatDate(deal.deadline)}</strong>
                </span>
              </div>
            </>
          )}

          {deal.notes && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-sm">{deal.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Negotiation History */}
      {!messagesLoading && messages && messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Negotiation History ({messages.length} messages)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={message.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-sm">
                          {message.sender?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">
                          {message.sender?.name || "Unknown"}
                        </p>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {message.message_type.replace("_", " ")}
                        </Badge>
                        {message.is_automated && (
                          <Badge variant="outline" className="text-xs">
                            Automated
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm">{message.content}</p>
                        {message.offer_amount && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-bold text-lg text-green-600">
                                {formatCurrency(message.offer_amount)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Negotiation Engine */}
      <DealNegotiationEngine dealId={dealId || ""} />
    </div>
  );
}
