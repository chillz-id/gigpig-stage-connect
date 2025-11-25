import type { Customer } from '@/hooks/useCustomers';
import type { ColumnAlignment, ColumnConfig, ColumnDefinition } from '@/types/column-config';

export interface CustomerTableColumn extends ColumnDefinition {
  width: number;
  alignment: ColumnAlignment;
}

export const buildCustomerColumns = (
  definitions: ColumnDefinition[],
  configs?: ColumnConfig[]
): CustomerTableColumn[] => {
  if (!configs) {
    return definitions.map((definition) => ({
      ...definition,
      width: definition.defaultWidth ?? definition.minWidth,
      alignment: definition.alignment ?? 'left',
    }));
  }

  const definitionMap = new Map(definitions.map((definition) => [definition.id, definition]));
  const mapped: CustomerTableColumn[] = [];

  configs
    .filter((config) => config.visible)
    .sort((a, b) => a.order - b.order)
    .forEach((config) => {
      const definition = definitionMap.get(config.id);
      if (!definition) return;

      mapped.push({
        ...definition,
        width: config.width,
        alignment: config.alignment ?? definition.alignment ?? 'left',
      });
    });

  return mapped;
};

export const getCustomerFullName = (customer: Customer): string => {
  if (customer.first_name && customer.last_name) {
    return `${customer.first_name} ${customer.last_name}`;
  }
  return customer.first_name || customer.last_name || '-';
};

export const getCustomerAddress = (customer: Customer): string => {
  if (customer.address) return customer.address;

  const parts = [
    customer.address_line1,
    customer.address_line2,
    customer.suburb || customer.city,
    customer.state,
    customer.postcode,
    customer.country,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : '-';
};

export const getSegmentBadgeClass = (segment: string): string => {
  switch (segment.toLowerCase()) {
    case 'vip':
      return 'bg-purple-600 text-white hover:bg-purple-700';
    case 'regular':
      return 'bg-blue-600 text-white hover:bg-blue-700';
    case 'new':
      return 'bg-green-600 text-white hover:bg-green-700';
    case 'prospect':
      return 'bg-amber-500 text-white hover:bg-amber-600';
    case 'inactive':
      return 'bg-gray-600 text-white hover:bg-gray-700';
    default:
      return 'bg-gray-200 text-gray-800 hover:bg-gray-300';
  }
};

export const getLeadScoreBadgeClass = (score: number | null): string => {
  if (!score) return 'bg-gray-200 text-gray-800';
  if (score >= 20) return 'bg-gradient-to-r from-orange-500 to-red-500 text-white';
  if (score >= 15) return 'bg-orange-500 text-white';
  if (score >= 10) return 'bg-yellow-500 text-white';
  return 'bg-blue-500 text-white';
};
