import { renderHook } from '@testing-library/react';
import { useColumnOrdering } from '@/hooks/crm/useColumnOrdering';
import type { ColumnAlignment, ColumnConfig, ColumnDefinition } from '@/types/column-config';

const columnDefinitions: ColumnDefinition[] = [
  {
    id: 'name',
    label: 'Name',
    accessor: 'name',
    defaultWidth: 200,
    minWidth: 150,
    required: true,
  },
  {
    id: 'email',
    label: 'Email',
    accessor: 'email',
    defaultWidth: 220,
    minWidth: 180,
  },
  {
    id: 'total_orders',
    label: 'Total Orders',
    accessor: 'total_orders',
    defaultWidth: 140,
    minWidth: 120,
  },
];

const columnConfigs: ColumnConfig[] = [
  { id: 'name', visible: true, width: 200, order: 0, alignment: 'left' },
  { id: 'email', visible: true, width: 220, order: 1, alignment: 'left' },
  { id: 'total_orders', visible: false, width: 140, order: 2, alignment: 'right' },
];

describe('useColumnOrdering', () => {
  it('prevents hiding required columns', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useColumnOrdering({ columnDefinitions, columnConfigs, onChange })
    );

    const outcome = result.current.toggleVisibility('name');

    expect(outcome).toEqual({ success: false, error: 'required-column' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('toggles optional column visibility and normalizes order', () => {
    const onChange = jest.fn();
    const { result } = renderHook(({ configs }) => useColumnOrdering({ columnDefinitions, columnConfigs: configs, onChange }), {
      initialProps: { configs: columnConfigs },
    });

    result.current.toggleVisibility('total_orders');

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0] as ColumnConfig[];
    expect(updated.find((config) => config.id === 'total_orders')?.visible).toBe(true);
    expect(updated.map((config) => config.order)).toEqual([0, 1, 2]);
  });

  it('enforces minimum width when resizing', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useColumnOrdering({ columnDefinitions, columnConfigs, onChange }));

    const tooSmall = result.current.changeWidth('email', 100);
    expect(tooSmall).toEqual({ success: false, error: 'min-width' });
    expect(onChange).not.toHaveBeenCalled();

    result.current.changeWidth('email', 200);

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'email', width: 200 }),
      ])
    );
  });

  it('moves columns and keeps sequential ordering', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useColumnOrdering({ columnDefinitions, columnConfigs, onChange }));

    result.current.moveColumn('email', 'up');

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'email', order: 0 }),
      expect.objectContaining({ id: 'name', order: 1 }),
      expect.objectContaining({ id: 'total_orders', order: 2 }),
    ]);
  });

  it('changes alignment for the provided column', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useColumnOrdering({ columnDefinitions, columnConfigs, onChange }));

    result.current.changeAlignment('total_orders', 'center' as ColumnAlignment);

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'total_orders', alignment: 'center' }),
      ])
    );
  });
});
