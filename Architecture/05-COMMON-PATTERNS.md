# Common Patterns

Code patterns and conventions used throughout the Stand Up Sydney codebase. Use these as templates when adding new features.

---

## Data Fetching Patterns

### TanStack Query Hook Pattern

Standard pattern for data fetching hooks using TanStack Query:

```typescript
// src/hooks/useEventApplications.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { eventApplicationService } from '@/services/event';

export const useEventApplications = (eventId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query for fetching data
  const {
    data: applications = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['event-applications', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      return eventApplicationService.listByEvent(eventId);
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,  // 5 minutes (platform standard)
  });

  // Mutation for data changes
  const applyMutation = useMutation({
    mutationFn: async (data: ApplicationData) => {
      if (!user) throw new Error('User not authenticated');
      return eventApplicationService.apply(user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-applications'] });
      toast({
        title: "Success!",
        description: "Application submitted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    applications,
    isLoading,
    error,
    applyToEvent: applyMutation.mutateAsync,
    isApplying: applyMutation.isPending
  };
};
```

**Key Points:**
- Always provide default empty array/object: `data = []`
- Use `enabled` to prevent queries when dependencies missing
- Invalidate related queries on mutation success
- Return both data and loading/error states
- Use `useToast` for user feedback

---

### Query Key Conventions

```typescript
// List queries
['events']                           // All events
['events', 'organization', orgId]    // Events by org
['events', eventId]                  // Single event

// Related data
['event-applications', eventId]      // Applications for event
['user-applications', userId]        // User's applications

// With filters
['events', { status: 'open', orgId }]
```

---

## Form Patterns

### React Hook Form + Zod Pattern

Standard pattern for validated forms:

```typescript
// src/components/events/EventApplicationForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// 1. Define schema
const formSchema = z.object({
  message: z.string().min(10, {
    message: "Message must be at least 10 characters",
  }),
  spotType: z.enum(['spot', 'feature', 'headline'], {
    required_error: "Please select a spot type",
  }),
  availabilityConfirmed: z.boolean().refine((val) => val === true, {
    message: "You must confirm your availability",
  }),
});

// 2. Infer type from schema
type FormData = z.infer<typeof formSchema>;

// 3. Component
export const EventApplicationForm = ({
  eventId,
  onSuccess,
}: {
  eventId: string;
  onSuccess?: () => void;
}) => {
  const { applyToEvent, isApplying } = useEventApplications(eventId);

  // 4. Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
      spotType: undefined,
      availabilityConfirmed: false,
    },
  });

  // 5. Submit handler
  const onSubmit = async (data: FormData) => {
    try {
      await applyToEvent({
        event_id: eventId,
        message: data.message,
        spot_type: data.spotType,
      });
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 6. Render form
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isApplying}>
          {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Application
        </Button>
      </form>
    </Form>
  );
};
```

**Key Points:**
- Define Zod schema outside component
- Use `z.infer<typeof schema>` for type safety
- Always provide `defaultValues`
- Use `FormField` render prop pattern
- Disable submit button during loading

---

## Service Layer Patterns

### Service Class Pattern

Standard pattern for business logic services:

```typescript
// src/services/invoiceService.ts

import { supabase } from '@/integrations/supabase/client';
import type { Invoice, InvoiceItem } from '@/types/invoice';

// 1. Define request/response types
export interface CreateInvoiceRequest {
  invoice_type: 'promoter' | 'comedian' | 'other';
  sender_name: string;
  sender_email: string;
  // ... other fields
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
}

// 2. Create service class
class InvoiceService {
  // Generate sequential ID
  async generateInvoiceNumber(type: string): Promise<string> {
    const prefix = type === 'promoter' ? 'PRO' : 'COM';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const { data } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `${prefix}-${year}${month}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    const sequence = data?.[0]
      ? parseInt(data[0].invoice_number.split('-')[2]) + 1
      : 1;

    return `${prefix}-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  // Create with related records
  async createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(request.invoice_type);

    // Insert invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        created_by: user.id,
        // ... map request fields
      })
      .select()
      .single();

    if (error) throw error;

    // Insert line items
    if (request.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(
          request.items.map((item, index) => ({
            invoice_id: invoice.id,
            item_order: index,
            ...item,
          }))
        );

      if (itemsError) throw itemsError;
    }

    return invoice;
  }

  // Fetch with relations
  async getInvoice(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*),
        invoice_recipients(*),
        invoice_payments(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // List with filters
  async listInvoices(filters?: {
    status?: string;
    organizationId?: string;
  }): Promise<Invoice[]> {
    let query = supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }
}

// 3. Export singleton instance
export const invoiceService = new InvoiceService();
```

**Key Points:**
- Use class for related methods
- Export singleton instance
- Check authentication in methods that need it
- Use type interfaces for request/response
- Handle related records in transactions when possible

---

## Context Patterns

### Auth-Aware Context Pattern

```typescript
// src/contexts/ProfileContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProfileContextType {
  activeProfile: Profile | null;
  availableProfiles: Profile[];
  setActiveProfile: (profile: Profile) => void;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profiles when user changes
  useEffect(() => {
    if (!user) {
      setActiveProfile(null);
      setAvailableProfiles([]);
      setIsLoading(false);
      return;
    }

    const fetchProfiles = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*, user_roles(*)')
          .eq('id', user.id)
          .single();

        if (data) {
          setAvailableProfiles(buildProfiles(data));
          // Restore from localStorage or use first
          const stored = localStorage.getItem(`activeProfile:${user.id}`);
          setActiveProfile(stored ? JSON.parse(stored) : availableProfiles[0]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [user]);

  // Persist active profile
  const handleSetActiveProfile = (profile: Profile) => {
    setActiveProfile(profile);
    if (user) {
      localStorage.setItem(`activeProfile:${user.id}`, JSON.stringify(profile));
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        activeProfile,
        availableProfiles,
        setActiveProfile: handleSetActiveProfile,
        isLoading,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

// Custom hook with error handling
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

// Convenience hook for active profile only
export const useActiveProfile = () => {
  const { activeProfile } = useProfile();
  return activeProfile;
};
```

**Key Points:**
- Provide default `undefined` and check in hook
- Clean up state when user logs out
- Persist user preferences to localStorage
- Provide convenience hooks for common use cases
- Handle loading state

---

## Component Patterns

### Protected Route Pattern

```typescript
// src/components/auth/ProtectedRoute.tsx

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  requireProfile?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles = [],
  requireProfile = false,
}) => {
  const { user, hasRole, isLoading } = useAuth();
  const location = useLocation();

  // Show nothing while checking auth
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (roles.length > 0 && !roles.some(role => hasRole(role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Usage in routes
<Route
  path="/admin/*"
  element={
    <ProtectedRoute roles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

---

### Profile-Aware Component Pattern

```typescript
// src/components/ProfileAwareComponent.tsx

import { useActiveProfile } from '@/contexts/ProfileContext';

export const ProfileAwareComponent = () => {
  const activeProfile = useActiveProfile();

  // Render different content based on profile type
  if (!activeProfile) {
    return <NoProfileSelected />;
  }

  switch (activeProfile.type) {
    case 'comedian':
      return <ComedianView profile={activeProfile} />;
    case 'organization':
      return <OrganizationView profile={activeProfile} />;
    case 'photographer':
      return <PhotographerView profile={activeProfile} />;
    default:
      return <DefaultView profile={activeProfile} />;
  }
};
```

---

## Error Handling Patterns

### Service Error Handling

```typescript
// Wrap Supabase errors with context
async function fetchWithErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await operation();

  if (error) {
    // Handle specific Supabase error codes
    if (error.code === '23505') {
      throw new Error('This record already exists');
    }
    if (error.code === 'PGRST116') {
      throw new Error('Record not found');
    }
    throw new Error(error.message || 'An unexpected error occurred');
  }

  if (!data) {
    throw new Error('No data returned');
  }

  return data;
}
```

### Component Error Boundary

```typescript
// Use ErrorBoundary from App.tsx for page-level errors
// For component-level, use try/catch in effects and handlers

const MyComponent = () => {
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    try {
      setError(null);
      await someService.doSomething();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (error) {
    return <Alert variant="destructive">{error}</Alert>;
  }

  return <div>...</div>;
};
```

---

## Loading State Patterns

### Skeleton Loading

```typescript
import { Skeleton } from '@/components/ui/skeleton';

const EventCard = ({ event, isLoading }: { event?: Event; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{event?.title}</CardTitle>
        <CardDescription>{event?.venue}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{event?.description}</p>
      </CardContent>
    </Card>
  );
};
```

---

## Import Conventions

Always use path aliases:

```typescript
// Good - use @ alias
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { invoiceService } from '@/services/invoiceService';

// Bad - relative paths for shared modules
import { Button } from '../../../components/ui/button';
```

---

## Related Documentation

- **[02-DIRECTORY-GUIDE.md](./02-DIRECTORY-GUIDE.md)** - Where to find files
- **[04-DATABASE-OVERVIEW.md](./04-DATABASE-OVERVIEW.md)** - Database patterns
- **`src/components/ui/`** - shadcn/ui components
- **`src/hooks/`** - Hook examples
- **`src/services/`** - Service examples
