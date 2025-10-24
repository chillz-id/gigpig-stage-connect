import { renderHook, act } from '@testing-library/react';
import { useSegmentManager } from '@/hooks/crm/useSegmentManager';
import type { SegmentDefinition } from '@/hooks/useCustomers';

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const toast = require('sonner').toast as {
  error: jest.Mock;
  success: jest.Mock;
};

const mutateAsync = jest.fn();

jest.mock('@/hooks/useCustomers', () => ({
  useSegments: jest.fn(),
  useCreateSegment: jest.fn(),
}));

const { useSegments, useCreateSegment } = jest.requireMock('@/hooks/useCustomers') as {
  useSegments: jest.Mock;
  useCreateSegment: jest.Mock;
};

describe('useSegmentManager', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    toast.error.mockReset();
    toast.success.mockReset();

    useSegments.mockReturnValue({ data: [{ slug: 'vip', name: 'VIP', color: null }] });
    useCreateSegment.mockReturnValue({
      mutateAsync,
      isPending: false,
    });
  });

  it('prevents creating duplicate segment names', async () => {
    const { result } = renderHook(() => useSegmentManager());

    act(() => {
      result.current.updateForm({ name: 'VIP' });
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('A segment with this name already exists.');
  });

  it('validates colour input before submitting', async () => {
    const { result } = renderHook(() => useSegmentManager());

    act(() => {
      result.current.updateForm({ name: 'Loyalty', color: 'invalid-colour' });
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('creates a segment and calls callback on success', async () => {
    const onSegmentCreated = jest.fn();
    const createdSegment: SegmentDefinition = {
      slug: 'loyalty',
      name: 'Loyalty Members',
      color: '#AA33FF',
    };

    mutateAsync.mockResolvedValue(createdSegment);

    const { result } = renderHook(() => useSegmentManager({ onSegmentCreated }));

    act(() => {
      result.current.updateForm({ name: 'Loyalty Members', color: '#aa33ff' });
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Loyalty Members',
      color: '#AA33FF',
    });
    expect(onSegmentCreated).toHaveBeenCalledWith(createdSegment);
    expect(result.current.dialogOpen).toBe(false);
    expect(result.current.form.name).toBe('');
    expect(result.current.form.color).toBe('');
    expect(toast.success).toHaveBeenCalledWith('Segment “Loyalty Members” created');
  });
});
