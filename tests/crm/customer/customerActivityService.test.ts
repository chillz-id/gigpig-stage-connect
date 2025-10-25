const activitySelectMock = jest.fn();
const activityOrderMock = jest.fn();
const activityLimitMock = jest.fn();
const activityEqMock = jest.fn();
const activityQueryBuilder = {
  eq: activityEqMock,
  order: activityOrderMock,
  limit: activityLimitMock,
};
const activityFromMock = jest.fn(() => ({
  select: activitySelectMock,
}));

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: activityFromMock,
  },
}));

describe('customerActivityService', () => {
  const { customerActivityService } = require('@/services/crm/customer-activity-service');

  beforeEach(() => {
    jest.clearAllMocks();
    activityLimitMock.mockResolvedValue({ data: [], error: null });
    activityOrderMock.mockReturnValue({ limit: activityLimitMock });
    activityEqMock.mockReturnValue(activityQueryBuilder);
    activitySelectMock.mockReturnValue({ eq: activityEqMock });
  });

  it('fetches timeline entries with descending order', async () => {
    activityLimitMock.mockResolvedValue({
      data: [{ activity_id: '1', customer_id: 'abc', activity_type: 'order', created_at: 'now', metadata: {} }],
      error: null,
    });

    const result = await customerActivityService.list('abc', 10);

    expect(activityFromMock).toHaveBeenCalledWith('customer_activity_timeline');
    expect(activitySelectMock).toHaveBeenCalledWith('*');
    expect(result).toHaveLength(1);
    expect(activityLimitMock).toHaveBeenCalledWith(10);
    expect(activityEqMock).toHaveBeenCalledWith('customer_id', 'abc');
  });

  it('surfaces errors from Supabase when listing by type', async () => {
    const failure = new Error('boom');
    activityLimitMock.mockResolvedValue({ data: null, error: failure });

    await expect(customerActivityService.listByType('abc', 'deal', 5)).rejects.toThrow(failure);
  });
});
