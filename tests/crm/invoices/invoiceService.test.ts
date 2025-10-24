const fromMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('invoiceService', () => {
  const { invoiceService } = require('@/services/crm/invoice-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists invoices for a user', async () => {
    const orderMock = jest.fn(() => ({
      data: [
        { id: 'inv-1', gst_treatment: 'inclusive' },
        { id: 'inv-2', gst_treatment: 'none' },
      ],
      error: null,
    }));
    const selectMock = jest.fn(() => ({ or: jest.fn(() => ({ order: orderMock })) }));
    fromMock.mockReturnValue({ select: selectMock });

    const invoices = await invoiceService.listForUser('user-1');

    expect(fromMock).toHaveBeenCalledWith('invoices');
    expect(selectMock).toHaveBeenCalled();
    expect(invoices).toHaveLength(2);
    expect(invoices[1].gst_treatment).toBe('none');
  });

  it('propagates Supabase errors on delete', async () => {
    fromMock.mockReturnValueOnce({
      select: jest.fn(() => ({ or: jest.fn(() => ({ order: jest.fn(() => ({ data: [], error: new Error('list failed') })) })) })),
    });

    await expect(invoiceService.listForUser('user-1')).rejects.toThrow('list failed');

    const deleteMock = jest.fn(() => ({ eq: jest.fn(() => ({ error: new Error('delete failed') })) }));
    fromMock.mockReturnValue({ delete: deleteMock });

    await expect(invoiceService.delete('inv-1')).rejects.toThrow('delete failed');
  });
});
