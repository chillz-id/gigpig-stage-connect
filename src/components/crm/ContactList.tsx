import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ContactCard, ContactGridPlaceholder } from './ContactCard';
import type { CRMContact } from '@/hooks/useContacts';

interface ContactListProps {
  contacts: CRMContact[];
  isLoading?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreateTask?: (contact: CRMContact) => void;
  onViewDeals?: (contact: CRMContact) => void;
}

export const ContactList = ({
  contacts,
  isLoading = false,
  searchValue,
  onSearchChange,
  onCreateTask,
  onViewDeals,
}: ContactListProps) => {
  return (
    <div className="space-y-6">
      <span className="sr-only" aria-live="polite">
        {isLoading ? 'Loading contacts' : `${contacts.length} contacts shown`}
      </span>
      <Card className="border bg-card/50 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search contacts by name, company, or email..."
            aria-label="Search contacts"
            className="pl-9"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ContactGridPlaceholder key={index} />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <Card className="border-dashed bg-muted/30 p-12 text-center">
          <h3 className="text-base font-semibold text-foreground">No contacts found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Adjust your search or connect new partners to populate this list.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onCreateTask={onCreateTask}
              onViewDeals={onViewDeals}
            />
          ))}
        </div>
      )}
    </div>
  );
};
