import { ColumnList } from './ColumnList';
import type { OrderedColumnEntry } from '@/hooks/crm/useColumnOrdering';

const meta = {
  title: 'CRM/Column Customizer/Column List',
  component: ColumnList,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

const sampleColumns: OrderedColumnEntry[] = [
  {
    definition: {
      id: 'name',
      label: 'Name',
      accessor: 'name',
      defaultWidth: 200,
      minWidth: 150,
      required: true,
    },
    config: { id: 'name', visible: true, width: 220, order: 0, alignment: 'left' },
  },
  {
    definition: {
      id: 'email',
      label: 'Email',
      accessor: 'email',
      defaultWidth: 220,
      minWidth: 180,
    },
    config: { id: 'email', visible: true, width: 260, order: 1, alignment: 'left' },
  },
  {
    definition: {
      id: 'total_orders',
      label: 'Total Orders',
      accessor: 'total_orders',
      defaultWidth: 140,
      minWidth: 120,
    },
    config: { id: 'total_orders', visible: false, width: 160, order: 2, alignment: 'right' },
  },
];

export const Default = {
  args: {
    columns: sampleColumns,
    onToggleVisibility: () => undefined,
    onMove: () => undefined,
    onWidthChange: () => undefined,
    onAlignmentChange: () => undefined,
  },
};
