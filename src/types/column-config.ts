/**
 * Column Configuration Types
 *
 * Supports customizable table columns with:
 * - Visibility toggle
 * - Resizable widths
 * - Templates for save/load presets
 */

export type ColumnAlignment = 'left' | 'center' | 'right';

export interface ColumnDefinition {
  id: string;
  label: string;
  accessor: string;
  defaultWidth: number;
  minWidth: number;
  sortable?: boolean;
  required?: boolean; // Cannot be hidden (e.g., Name column)
  alignment?: ColumnAlignment;
}

export interface ColumnConfig {
  id: string;
  visible: boolean;
  width: number;
  order: number;
  alignment?: ColumnAlignment;
}

export interface ColumnTemplate {
  id: string;
  name: string;
  description?: string;
  configs: ColumnConfig[];
  createdAt: string;
  isDefault?: boolean;
}

export interface TableColumnSettings {
  columns: ColumnConfig[];
  templates: ColumnTemplate[];
  activeTemplateId: string | null;
}

/**
 * Default customer table column definitions
 */
export const DEFAULT_CUSTOMER_COLUMNS: ColumnDefinition[] = [
  {
    id: 'name',
    label: 'Name',
    accessor: 'first_name',
    defaultWidth: 200,
    minWidth: 100,
    sortable: true,
    required: true,
  },
  {
    id: 'email',
    label: 'Email',
    accessor: 'email',
    defaultWidth: 250,
    minWidth: 100,
    sortable: true,
  },
  {
    id: 'phone',
    label: 'Mobile',
    accessor: 'mobile',
    defaultWidth: 150,
    minWidth: 100,
  },
  {
    id: 'segments',
    label: 'Segments',
    accessor: 'customer_segment',
    defaultWidth: 180,
    minWidth: 100,
    sortable: true,
    alignment: 'left',
  },
  {
    id: 'lead_score',
    label: 'Lead Score',
    accessor: 'lead_score',
    defaultWidth: 120,
    minWidth: 100,
    sortable: true,
    alignment: 'center',
  },
  {
    id: 'total_orders',
    label: 'Orders',
    accessor: 'total_orders',
    defaultWidth: 100,
    minWidth: 100,
    sortable: true,
    alignment: 'right',
  },
  {
    id: 'total_spent',
    label: 'Total Spent',
    accessor: 'total_spent',
    defaultWidth: 130,
    minWidth: 100,
    sortable: true,
    alignment: 'right',
  },
  {
    id: 'last_order_date',
    label: 'Last Order',
    accessor: 'last_order_date',
    defaultWidth: 150,
    minWidth: 100,
    sortable: true,
  },
  {
    id: 'landline',
    label: 'Landline',
    accessor: 'landline',
    defaultWidth: 150,
    minWidth: 100,
  },
  {
    id: 'company',
    label: 'Company',
    accessor: 'company',
    defaultWidth: 180,
    minWidth: 100,
  },
  {
    id: 'address',
    label: 'Address',
    accessor: 'address',
    defaultWidth: 250,
    minWidth: 100,
  },
  {
    id: 'address_line1',
    label: 'Address Line 1',
    accessor: 'address_line1',
    defaultWidth: 200,
    minWidth: 100,
  },
  {
    id: 'address_line2',
    label: 'Address Line 2',
    accessor: 'address_line2',
    defaultWidth: 200,
    minWidth: 100,
  },
  {
    id: 'suburb',
    label: 'Suburb',
    accessor: 'suburb',
    defaultWidth: 150,
    minWidth: 100,
  },
  {
    id: 'city',
    label: 'City',
    accessor: 'city',
    defaultWidth: 150,
    minWidth: 100,
  },
  {
    id: 'state',
    label: 'State',
    accessor: 'state',
    defaultWidth: 100,
    minWidth: 100,
  },
  {
    id: 'postcode',
    label: 'Postcode',
    accessor: 'postcode',
    defaultWidth: 100,
    minWidth: 100,
  },
  {
    id: 'country',
    label: 'Country',
    accessor: 'country',
    defaultWidth: 120,
    minWidth: 100,
  },
  {
    id: 'date_of_birth',
    label: 'Date of Birth',
    accessor: 'date_of_birth',
    defaultWidth: 130,
    minWidth: 100,
    sortable: true,
  },
  {
    id: 'age_band',
    label: 'Age Band',
    accessor: 'age_band',
    defaultWidth: 100,
    minWidth: 100,
    alignment: 'center',
  },
  {
    id: 'marketing_opt_in',
    label: 'Marketing Opt-in',
    accessor: 'marketing_opt_in',
    defaultWidth: 140,
    minWidth: 100,
    alignment: 'center',
  },
  {
    id: 'source',
    label: 'Source',
    accessor: 'source',
    defaultWidth: 150,
    minWidth: 100,
  },
  {
    id: 'preferred_venue',
    label: 'Preferred Venue',
    accessor: 'preferred_venue',
    defaultWidth: 180,
    minWidth: 100,
  },
  {
    id: 'last_event_name',
    label: 'Last Event',
    accessor: 'last_event_name',
    defaultWidth: 200,
    minWidth: 100,
  },
  {
    id: 'customer_since',
    label: 'Customer Since',
    accessor: 'customer_since',
    defaultWidth: 150,
    minWidth: 100,
    sortable: true,
    alignment: 'left',
  },
  {
    id: 'updated_at',
    label: 'Last Updated',
    accessor: 'updated_at',
    defaultWidth: 150,
    minWidth: 100,
    sortable: true,
  },
];

/**
 * Default column configurations (all visible)
 */
export const getDefaultColumnConfigs = (): ColumnConfig[] => {
  return DEFAULT_CUSTOMER_COLUMNS.map((col, index) => ({
    id: col.id,
    visible: true,
    width: col.defaultWidth,
    order: index,
    alignment: col.alignment ?? 'left',
  }));
};

/**
 * Preset templates
 */
export const DEFAULT_TEMPLATES: ColumnTemplate[] = [
  {
    id: 'default',
    name: 'All Columns',
    description: 'Show all available columns',
    configs: getDefaultColumnConfigs(),
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'compact',
    name: 'Compact View',
    description: 'Essential columns only',
    configs: [
      { id: 'name', visible: true, width: 200, order: 0 },
      { id: 'email', visible: true, width: 250, order: 1 },
      { id: 'phone', visible: true, width: 150, order: 2 },
      { id: 'total_orders', visible: true, width: 100, order: 3 },
      { id: 'segments', visible: false, width: 180, order: 4 },
      { id: 'lead_score', visible: false, width: 120, order: 5 },
      { id: 'total_spent', visible: false, width: 130, order: 6 },
      { id: 'last_order_date', visible: false, width: 150, order: 7 },
      { id: 'landline', visible: false, width: 150, order: 8 },
      { id: 'company', visible: false, width: 180, order: 9 },
      { id: 'address', visible: false, width: 250, order: 10 },
      { id: 'address_line1', visible: false, width: 200, order: 11 },
      { id: 'address_line2', visible: false, width: 200, order: 12 },
      { id: 'suburb', visible: false, width: 150, order: 13 },
      { id: 'city', visible: false, width: 150, order: 14 },
      { id: 'state', visible: false, width: 100, order: 15 },
      { id: 'postcode', visible: false, width: 100, order: 16 },
      { id: 'country', visible: false, width: 120, order: 17 },
      { id: 'date_of_birth', visible: false, width: 130, order: 18 },
      { id: 'age_band', visible: false, width: 100, order: 19 },
      { id: 'marketing_opt_in', visible: false, width: 140, order: 20 },
      { id: 'source', visible: false, width: 150, order: 21 },
      { id: 'preferred_venue', visible: false, width: 180, order: 22 },
      { id: 'last_event_name', visible: false, width: 200, order: 23 },
      { id: 'customer_since', visible: false, width: 150, order: 24 },
      { id: 'updated_at', visible: false, width: 150, order: 25 },
    ],
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'sales',
    name: 'Sales Focus',
    description: 'Revenue and engagement metrics',
    configs: [
      { id: 'name', visible: true, width: 180, order: 0 },
      { id: 'segments', visible: true, width: 180, order: 1 },
      { id: 'lead_score', visible: true, width: 120, order: 2 },
      { id: 'total_orders', visible: true, width: 100, order: 3 },
      { id: 'total_spent', visible: true, width: 130, order: 4 },
      { id: 'last_order_date', visible: true, width: 150, order: 5 },
      { id: 'email', visible: false, width: 250, order: 6 },
      { id: 'phone', visible: false, width: 150, order: 7 },
      { id: 'landline', visible: false, width: 150, order: 8 },
      { id: 'company', visible: false, width: 180, order: 9 },
      { id: 'address', visible: false, width: 250, order: 10 },
      { id: 'address_line1', visible: false, width: 200, order: 11 },
      { id: 'address_line2', visible: false, width: 200, order: 12 },
      { id: 'suburb', visible: false, width: 150, order: 13 },
      { id: 'city', visible: false, width: 150, order: 14 },
      { id: 'state', visible: false, width: 100, order: 15 },
      { id: 'postcode', visible: false, width: 100, order: 16 },
      { id: 'country', visible: false, width: 120, order: 17 },
      { id: 'date_of_birth', visible: false, width: 130, order: 18 },
      { id: 'age_band', visible: false, width: 100, order: 19 },
      { id: 'marketing_opt_in', visible: false, width: 140, order: 20 },
      { id: 'source', visible: false, width: 150, order: 21 },
      { id: 'preferred_venue', visible: false, width: 180, order: 22 },
      { id: 'last_event_name', visible: false, width: 200, order: 23 },
      { id: 'customer_since', visible: false, width: 150, order: 24 },
      { id: 'updated_at', visible: false, width: 150, order: 25 },
    ],
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
];
