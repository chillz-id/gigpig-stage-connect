import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomer } from '@/hooks/useCustomers';
import { useCustomerActivity } from '@/hooks/useCustomerActivity';
import { ActivityTimeline } from '@/components/crm/ActivityTimeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  DollarSign,
  User,
  Building,
  MessageSquare,
  CheckSquare,
  Pencil,
} from 'lucide-react';
import { formatCurrency, formatDate, formatPhone, getInitials } from '@/utils/formatters';
import { EditCustomerDialog } from '@/components/crm/EditCustomerDialog';

/**
 * Customer Detail Page
 *
 * Full customer profile view with:
 * - Profile information
 * - Contact details
 * - Engagement metrics
 * - Activity timeline
 * - Quick actions (message, task, deal)
 */
export const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: customer, isLoading: customerLoading } = useCustomer(id);
  const { data: activities, isLoading: activitiesLoading } = useCustomerActivity(id);
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (customerLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 animate-pulse rounded" />
          <div className="flex-1">
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-2" />
            <div className="h-4 w-96 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/crm/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Customer not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSegmentClasses = (segment: string) => {
    switch (segment.toLowerCase()) {
      case 'vip':
        return 'bg-purple-600 text-white';
      case 'regular':
        return 'bg-blue-600 text-white';
      case 'new':
        return 'bg-green-600 text-white';
      case 'inactive':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Unknown Customer';
  const addressSummary = [
    customer.suburb,
    customer.city,
    customer.state,
    customer.postcode,
    customer.country,
  ]
    .filter((part): part is string => !!part && part.trim().length > 0)
    .join(', ');
  const hasAddress = Boolean(
    customer.address_line1 ||
      customer.address_line2 ||
      addressSummary
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/crm/customers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div>
            <h1 className="text-2xl font-bold">{fullName}</h1>
            <p className="text-sm text-muted-foreground">Customer ID: {customer.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="professional-button" size="sm" onClick={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Customer
          </Button>
          <Button className="professional-button" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Send Message
          </Button>
          <Button className="professional-button" size="sm">
            <CheckSquare className="mr-2 h-4 w-4" />
            Create Task
          </Button>
          <Button variant="default" size="sm">
            Create Deal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                  {getInitials(customer.first_name, customer.last_name)}
                </div>
                <div>
                  <CardTitle>{fullName}</CardTitle>
                  <CardDescription>{customer.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.customer_segments && customer.customer_segments.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Segments</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.customer_segments.map((segment) => (
                      <Badge key={segment} className={getSegmentClasses(segment)}>
                        {segment.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Contact Information</h3>

                {customer.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Email</p>
                      <a href={`mailto:${customer.email}`} className="text-sm text-blue-600 hover:underline break-all">
                        {customer.email}
                      </a>
                    </div>
                  </div>
                )}

                {customer.mobile && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Mobile</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPhone(customer.mobile)}
                      </p>
                    </div>
                  </div>
                )}

                {customer.landline && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Landline</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPhone(customer.landline)}
                      </p>
                    </div>
                  </div>
                )}

                {hasAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Address</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {customer.address_line1 && <p>{customer.address_line1}</p>}
                        {customer.address_line2 && <p>{customer.address_line2}</p>}
                        {addressSummary && <p>{addressSummary}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {customer.company && (
                  <div className="flex items-start gap-3">
                    <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Company</p>
                      <p className="text-sm text-muted-foreground">{customer.company}</p>
                    </div>
                  </div>
                )}

                {customer.date_of_birth && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Date of Birth</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(customer.date_of_birth)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Orders</span>
                </div>
                <span className="font-semibold">{customer.total_orders || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Spent</span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(Number(customer.total_spent) || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Last Order</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(customer.last_order_date)}
                </span>
              </div>

              {customer.last_event_name && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Last Event</span>
                  </div>
                  <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {customer.last_event_name}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Customer Since</span>
                <span className="text-sm font-medium">
                  {formatDate(customer.customer_since)}
                </span>
              </div>

              {customer.source && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Source</span>
                  <Badge className="professional-button capitalize">
                    {customer.source}
                  </Badge>
                </div>
              )}

              {customer.marketing_opt_in !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Marketing Opt-in</span>
                  <Badge variant={customer.marketing_opt_in ? 'default' : 'secondary'}>
                    {customer.marketing_opt_in ? 'Yes' : 'No'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                All interactions and activities for this customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="order">Orders</TabsTrigger>
                  <TabsTrigger value="message">Messages</TabsTrigger>
                  <TabsTrigger value="deal">Deals</TabsTrigger>
                  <TabsTrigger value="task">Tasks</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <ActivityTimeline
                    activities={activities || []}
                    isLoading={activitiesLoading}
                  />
                </TabsContent>

                <TabsContent value="order" className="mt-6">
                  <ActivityTimeline
                    activities={activities?.filter(a => a.activity_type === 'order') || []}
                    isLoading={activitiesLoading}
                  />
                </TabsContent>

                <TabsContent value="message" className="mt-6">
                  <ActivityTimeline
                    activities={activities?.filter(a => a.activity_type === 'message') || []}
                    isLoading={activitiesLoading}
                  />
                </TabsContent>

                <TabsContent value="deal" className="mt-6">
                  <ActivityTimeline
                    activities={activities?.filter(a => a.activity_type === 'deal') || []}
                    isLoading={activitiesLoading}
                  />
                </TabsContent>

                <TabsContent value="task" className="mt-6">
                  <ActivityTimeline
                    activities={activities?.filter(a => a.activity_type === 'task') || []}
                    isLoading={activitiesLoading}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditCustomerDialog customer={customer} open={isEditOpen} onOpenChange={setIsEditOpen} />
    </div>
  );
};
