import { buildCustomerColumns, getCustomerFullName, getCustomerAddress, getSegmentBadgeClass, getLeadScoreBadgeClass } from '@/utils/crm/customer';
import type { ColumnConfig, ColumnDefinition } from '@/types/column-config';
import type { Customer } from '@/hooks/useCustomers';

const definitions: ColumnDefinition[] = [
  { id: 'name', label: 'Name', accessor: 'name', defaultWidth: 200, minWidth: 150, sortable: true },
  { id: 'email', label: 'Email', accessor: 'email', defaultWidth: 220, minWidth: 180 },
];

describe('customer utils', () => {
  it('builds default columns when no configs provided', () => {
    const result = buildCustomerColumns(definitions);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'name', width: 200, alignment: 'left' });
  });

  it('honours column configs visibility and ordering', () => {
    const configs: ColumnConfig[] = [
      { id: 'email', visible: true, width: 250, order: 0, alignment: 'center' },
      { id: 'name', visible: false, width: 200, order: 1, alignment: 'left' },
    ];

    const result = buildCustomerColumns(definitions, configs);
    expect(result).toEqual([
      expect.objectContaining({ id: 'email', width: 250, alignment: 'center' }),
    ]);
  });

  it('computes customer full name fallbacks', () => {
    const customer = { first_name: 'Ada', last_name: 'Lovelace' } as Customer;
    expect(getCustomerFullName(customer)).toBe('Ada Lovelace');
    expect(getCustomerFullName({ first_name: 'Ada' } as Customer)).toBe('Ada');
    expect(getCustomerFullName({} as Customer)).toBe('-');
  });

  it('formats customer address using fallback parts', () => {
    expect(getCustomerAddress({ address: '123 Main', country: 'AU' } as Customer)).toBe('123 Main');
    expect(
      getCustomerAddress({
        address_line1: '1 High St',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2000',
      } as Customer)
    ).toBe('1 High St, Sydney, NSW, 2000');
    expect(getCustomerAddress({} as Customer)).toBe('-');
  });

  it('returns deterministic badge classes', () => {
    expect(getSegmentBadgeClass('vip')).toContain('purple');
    expect(getSegmentBadgeClass('unknown')).toContain('gray');
    expect(getLeadScoreBadgeClass(null)).toContain('gray');
    expect(getLeadScoreBadgeClass(18)).toContain('orange');
  });
});
