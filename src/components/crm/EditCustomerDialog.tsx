import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useUpdateCustomer, useSegments } from '@/hooks/useCustomers';
import type { Customer, CustomerProfileUpdates } from '@/hooks/useCustomers';

interface EditCustomerDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditCustomerDialog = ({ customer, open, onOpenChange }: EditCustomerDialogProps) => {
  const [firstName, setFirstName] = useState(customer.first_name ?? '');
  const [lastName, setLastName] = useState(customer.last_name ?? '');
  const [email, setEmail] = useState(customer.email ?? '');
  const [mobile, setMobile] = useState(customer.mobile ?? '');
  const [landline, setLandline] = useState(customer.landline ?? '');
  const [addressLine1, setAddressLine1] = useState(customer.address_line1 ?? '');
  const [addressLine2, setAddressLine2] = useState(customer.address_line2 ?? '');
  const [suburb, setSuburb] = useState(customer.suburb ?? '');
  const [city, setCity] = useState(customer.city ?? '');
  const [stateRegion, setStateRegion] = useState(customer.state ?? '');
  const [postcode, setPostcode] = useState(customer.postcode ?? '');
  const [country, setCountry] = useState(customer.country ?? '');
  const [marketingOptIn, setMarketingOptIn] = useState<boolean>(customer.marketing_opt_in ?? false);
  const [selectedSegments, setSelectedSegments] = useState<string[]>(customer.customer_segments || []);

  const updateCustomer = useUpdateCustomer();
  const { data: segmentOptions } = useSegments();

  const toggleSegment = (slug: string) => {
    setSelectedSegments((prev) => {
      const set = new Set(prev);
      if (set.has(slug)) {
        set.delete(slug);
      } else {
        set.add(slug);
      }
      return Array.from(set);
    });
  };

  useEffect(() => {
    if (open) {
      setFirstName(customer.first_name ?? '');
      setLastName(customer.last_name ?? '');
      setEmail(customer.email ?? '');
      setMobile(customer.mobile ?? '');
      setLandline(customer.landline ?? '');
      setAddressLine1(customer.address_line1 ?? '');
      setAddressLine2(customer.address_line2 ?? '');
      setSuburb(customer.suburb ?? '');
      setCity(customer.city ?? '');
      setStateRegion(customer.state ?? '');
      setPostcode(customer.postcode ?? '');
      setCountry(customer.country ?? '');
      setMarketingOptIn(customer.marketing_opt_in ?? false);
      setSelectedSegments(customer.customer_segments || []);
    }
  }, [
    open,
    customer.first_name,
    customer.last_name,
    customer.email,
    customer.mobile,
    customer.landline,
    customer.address_line1,
    customer.address_line2,
    customer.suburb,
    customer.city,
    customer.state,
    customer.postcode,
    customer.country,
    customer.marketing_opt_in,
    customer.customer_segments,
  ]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedMobile = mobile.trim();
    const trimmedLandline = landline.trim();
    const trimmedAddressLine1 = addressLine1.trim();
    const trimmedAddressLine2 = addressLine2.trim();
    const trimmedSuburb = suburb.trim();
    const trimmedCity = city.trim();
    const trimmedState = stateRegion.trim();
    const trimmedPostcode = postcode.trim();
    const trimmedCountry = country.trim();

    if (!trimmedEmail) {
      toast.error('Email is required');
      return;
    }

    const changes: Record<string, unknown> = {};

    if (trimmedFirst !== (customer.first_name ?? '').trim()) {
      changes.first_name = trimmedFirst;
    }

    if (trimmedLast !== (customer.last_name ?? '').trim()) {
      changes.last_name = trimmedLast;
    }

    if (trimmedEmail !== (customer.email ?? '').trim()) {
      changes.email = trimmedEmail;
    }

    if (trimmedMobile !== (customer.mobile ?? '').trim()) {
      changes.mobile = trimmedMobile;
    }

    if (trimmedLandline !== (customer.landline ?? '').trim()) {
      changes.landline = trimmedLandline;
    }

    if (trimmedAddressLine1 !== (customer.address_line1 ?? '').trim()) {
      changes.address_line1 = trimmedAddressLine1;
    }

    if (trimmedAddressLine2 !== (customer.address_line2 ?? '').trim()) {
      changes.address_line2 = trimmedAddressLine2;
    }

    if (trimmedSuburb !== (customer.suburb ?? '').trim()) {
      changes.suburb = trimmedSuburb;
    }

    if (trimmedCity !== (customer.city ?? '').trim()) {
      changes.city = trimmedCity;
    }

    if (trimmedState !== (customer.state ?? '').trim()) {
      changes.state = trimmedState;
    }

    if (trimmedPostcode !== (customer.postcode ?? '').trim()) {
      changes.postcode = trimmedPostcode;
    }

    if (trimmedCountry !== (customer.country ?? '').trim()) {
      changes.country = trimmedCountry;
    }

    if (marketingOptIn !== (customer.marketing_opt_in ?? false)) {
      changes.marketing_opt_in = marketingOptIn;
    }

    const currentSegmentsSorted = [...(customer.customer_segments || [])].sort();
    const nextSegmentsSorted = [...selectedSegments].sort();
    const segmentsChanged =
      currentSegmentsSorted.length !== nextSegmentsSorted.length ||
      currentSegmentsSorted.some((value, index) => value !== nextSegmentsSorted[index]);

    if (segmentsChanged) {
      changes.segments = selectedSegments;
    }

    if (Object.keys(changes).length === 0) {
      toast.info('No changes to save');
      onOpenChange(false);
      return;
    }

    try {
      const updates: CustomerProfileUpdates = {
        first_name: trimmedFirst,
        last_name: trimmedLast,
        email: trimmedEmail,
        mobile: trimmedMobile,
        landline: trimmedLandline,
        address_line1: trimmedAddressLine1,
        address_line2: trimmedAddressLine2,
        suburb: trimmedSuburb,
        city: trimmedCity,
        state: trimmedState,
        postcode: trimmedPostcode,
        country: trimmedCountry,
        marketing_opt_in: marketingOptIn,
      };

      if (segmentsChanged) {
        updates.segments = selectedSegments;
      }

      await updateCustomer.mutateAsync({
        id: customer.id,
        updates,
      });

      toast.success('Customer details updated');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update customer', error);
      toast.error('Unable to update customer. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update core profile information. Changes sync across customer views immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Name</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-first-name">First Name</Label>
                <Input
                  id="customer-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-last-name">Last Name</Label>
                <Input
                  id="customer-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Contact</h3>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-mobile">Mobile</Label>
                <Input
                  id="customer-mobile"
                  value={mobile}
                  onChange={(event) => setMobile(event.target.value)}
                  placeholder="e.g. +61 400 000 000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-landline">Landline</Label>
                <Input
                  id="customer-landline"
                  value={landline}
                  onChange={(event) => setLandline(event.target.value)}
                  placeholder="Optional"
                />
              </div>
          </div>
        </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Segments</h3>
            <p className="text-xs text-muted-foreground">
              Apply one or more tags to categorise this customer.
            </p>
            <div className="flex flex-wrap gap-2">
              {segmentOptions?.map((segment) => {
                const active = selectedSegments.includes(segment.slug);
                return (
                  <Button
                    key={segment.slug}
                    type="button"
                    size="sm"
                    variant={active ? 'default' : 'secondary'}
                    onClick={() => toggleSegment(segment.slug)}
                  >
                    {segment.name}
                  </Button>
                );
              })}
              {segmentOptions && segmentOptions.length === 0 && (
                <span className="text-xs text-muted-foreground">No segments defined yet.</span>
              )}
            </div>
            {selectedSegments.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {selectedSegments.map((slug) => (
                  <Badge key={slug} variant="secondary">
                    {slug}
                    <button
                      type="button"
                      onClick={() => toggleSegment(slug)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Address</h3>
            <div className="space-y-2">
              <Label htmlFor="customer-address-line1">Address Line 1</Label>
              <Input
                id="customer-address-line1"
                value={addressLine1}
                onChange={(event) => setAddressLine1(event.target.value)}
                autoComplete="address-line1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address-line2">Address Line 2</Label>
              <Input
                id="customer-address-line2"
                value={addressLine2}
                onChange={(event) => setAddressLine2(event.target.value)}
                autoComplete="address-line2"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-suburb">Suburb</Label>
                <Input
                  id="customer-suburb"
                  value={suburb}
                  onChange={(event) => setSuburb(event.target.value)}
                  autoComplete="address-level3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-city">City</Label>
                <Input
                  id="customer-city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  autoComplete="address-level2"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="customer-state">State</Label>
                <Input
                  id="customer-state"
                  value={stateRegion}
                  onChange={(event) => setStateRegion(event.target.value)}
                  autoComplete="address-level1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-postcode">Postcode</Label>
                <Input
                  id="customer-postcode"
                  value={postcode}
                  onChange={(event) => setPostcode(event.target.value)}
                  autoComplete="postal-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-country">Country</Label>
                <Input
                  id="customer-country"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  autoComplete="country-name"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="customer-marketing-opt-in">Marketing Opt-in</Label>
              <p className="text-xs text-muted-foreground">
                Toggle whether this customer has consented to receive marketing updates.
              </p>
            </div>
            <Switch
              id="customer-marketing-opt-in"
              checked={marketingOptIn}
              onCheckedChange={setMarketingOptIn}
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              className="professional-button"
              onClick={() => onOpenChange(false)}
              disabled={updateCustomer.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateCustomer.isPending}>
              {updateCustomer.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
