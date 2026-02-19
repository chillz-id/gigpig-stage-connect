/**
 * ClientSelector - Searchable client dropdown for invoice forms
 *
 * Features:
 * - Command/Popover pattern for accessible keyboard navigation
 * - Results grouped by client type
 * - "Add New Client" option at bottom
 * - Shows avatar, name, email, and type badge
 */

import React, { useState, useCallback } from 'react';
import { Check, ChevronsUpDown, Plus, Search, User, Building2, Camera, Video, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useClientSearch, type InvoiceClient, type ClientType } from '@/hooks/useClientSearch';

interface ClientSelectorProps {
  value?: InvoiceClient | null;
  onSelect: (client: InvoiceClient | null) => void;
  onAddNewClient: () => void;
  placeholder?: string;
  disabled?: boolean;
}

// Map client type to icon and badge color
const clientTypeConfig: Record<ClientType, {
  icon: React.ElementType;
  label: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  comedian: { icon: User, label: 'Comedian', badgeVariant: 'default' },
  photographer: { icon: Camera, label: 'Photographer', badgeVariant: 'secondary' },
  videographer: { icon: Video, label: 'Videographer', badgeVariant: 'secondary' },
  manager: { icon: Users, label: 'Manager', badgeVariant: 'secondary' },
  organization: { icon: Building2, label: 'Organization', badgeVariant: 'outline' },
  venue: { icon: MapPin, label: 'Venue', badgeVariant: 'outline' },
  profile: { icon: User, label: 'User', badgeVariant: 'secondary' },
  custom: { icon: User, label: 'Custom', badgeVariant: 'outline' },
};

// Group clients by type for display
function groupClientsByType(clients: InvoiceClient[]): Map<ClientType, InvoiceClient[]> {
  const groups = new Map<ClientType, InvoiceClient[]>();

  clients.forEach(client => {
    const existing = groups.get(client.type) || [];
    existing.push(client);
    groups.set(client.type, existing);
  });

  return groups;
}

// Get initials from name for avatar fallback
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ClientSelector({
  value,
  onSelect,
  onAddNewClient,
  placeholder = 'Select a client...',
  disabled = false,
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const { clients, isLoading, search, searchQuery } = useClientSearch({ limit: 30 });

  const handleSelect = useCallback((client: InvoiceClient) => {
    onSelect(client);
    setOpen(false);
  }, [onSelect]);

  const handleClear = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  const handleAddNew = useCallback(() => {
    setOpen(false);
    onAddNewClient();
  }, [onAddNewClient]);

  const groupedClients = groupClientsByType(clients);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between h-auto min-h-10 py-2"
        >
          {value ? (
            <div className="flex items-center gap-3 text-left">
              <Avatar className="h-8 w-8">
                <AvatarImage src={value.avatarUrl || undefined} alt={value.name} />
                <AvatarFallback className="text-xs">{getInitials(value.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{value.name}</div>
                {value.email && (
                  <div className="text-xs text-muted-foreground truncate">{value.email}</div>
                )}
              </div>
              <Badge variant={(clientTypeConfig[value.type] || clientTypeConfig.custom).badgeVariant} className="shrink-0">
                {(clientTypeConfig[value.type] || clientTypeConfig.custom).label}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search clients by name or email..."
            value={searchQuery}
            onValueChange={search}
          />
          <CommandList>
            {searchQuery.length < 2 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                Type at least 2 characters to search
              </div>
            ) : isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : clients.length === 0 ? (
              <CommandEmpty>
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">No clients found</p>
                  <Button
                    size="sm"
                    onClick={handleAddNew}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Client
                  </Button>
                </div>
              </CommandEmpty>
            ) : (
              <>
                {Array.from(groupedClients.entries()).map(([type, typeClients]) => {
                  const config = clientTypeConfig[type] || clientTypeConfig.custom;
                  const TypeIcon = config.icon;

                  return (
                    <CommandGroup
                      key={type}
                      heading={
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4" />
                          {config.label}s
                        </div>
                      }
                    >
                      {typeClients.map(client => (
                        <CommandItem
                          key={`${client.type}-${client.id}`}
                          value={`${client.type}-${client.id}`}
                          onSelect={() => handleSelect(client)}
                          className="flex items-center gap-3 py-2"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={client.avatarUrl || undefined} alt={client.name} />
                            <AvatarFallback className="text-xs">{getInitials(client.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{client.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {client.email || client.subtitle || 'No email'}
                            </div>
                          </div>
                          {value?.id === client.id && value?.type === client.type && (
                            <Check className="h-4 w-4 shrink-0" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })}

                <CommandSeparator />

                <CommandGroup>
                  <CommandItem
                    onSelect={handleAddNew}
                    className="flex items-center gap-2 text-primary cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Client
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ClientSelector;
