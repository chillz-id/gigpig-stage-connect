import { useQuery } from '@tanstack/react-query';
import {
  contactService,
  type CRMContact,
  type ContactRole,
} from '@/services/crm/contact-service';

interface ContactsQueryOptions {
  role: ContactRole;
  search?: string;
  enabled?: boolean;
  limit?: number;
}

const DEFAULT_LIMIT = 100;

export const useContacts = ({
  role,
  search,
  enabled = true,
  limit = DEFAULT_LIMIT,
}: ContactsQueryOptions) => {
  return useQuery({
    queryKey: ['crm-contacts', role, search, limit],
    enabled,
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      return contactService.list({ role, search, limit });
    },
  });
};

export type { CRMContact, ContactRole } from '@/services/crm/contact-service';
