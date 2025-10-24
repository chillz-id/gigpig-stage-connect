import { calendarIntegrationService } from '@/services/calendar';
import { supabase } from '@/integrations/supabase/client';

jest.mock('@/integrations/supabase/client', () => {
  const from = jest.fn();
  return {
    supabase: {
      from,
    },
  };
});

const supabaseFrom = supabase.from as jest.Mock;

describe('calendarIntegrationService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists integrations for a user ordered by created date', async () => {
    const orderMock = jest.fn().mockResolvedValue({ data: [{ id: 'ci-1' }], error: null });
    const eqMock = jest.fn(() => ({ order: orderMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));

    supabaseFrom.mockReturnValueOnce({ select: selectMock });

    const result = await calendarIntegrationService.listByUser('user-123');

    expect(supabaseFrom).toHaveBeenCalledWith('calendar_integrations');
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(eqMock).toHaveBeenCalledWith('user_id', 'user-123');
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual([{ id: 'ci-1' }]);
  });

  it('upserts an integration with conflict on user and provider', async () => {
    const singleMock = jest.fn().mockResolvedValue({ data: { id: 'ci-1' }, error: null });
    const selectMock = jest.fn(() => ({ single: singleMock }));
    const upsertMock = jest.fn(() => ({ select: selectMock }));

    supabaseFrom.mockReturnValueOnce({ upsert: upsertMock });

    const payload = {
      user_id: 'user-123',
      provider: 'google' as const,
      access_token: 'access',
      refresh_token: 'refresh',
      calendar_id: 'primary',
      is_active: true,
      settings: {},
    };

    await calendarIntegrationService.upsertIntegration(payload);

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        provider: 'google',
        access_token: 'access',
        refresh_token: 'refresh',
        calendar_id: 'primary',
        is_active: true,
        settings: {},
        updated_at: expect.any(String),
      }),
      { onConflict: 'user_id,provider' }
    );
    expect(selectMock).toHaveBeenCalled();
    expect(singleMock).toHaveBeenCalled();
  });

  it('marks an integration as synced and increments sync count', async () => {
    const getIntegrationSpy = jest
      .spyOn(calendarIntegrationService as any, 'getIntegration')
      .mockResolvedValue({ sync_count: 2 } as any);

    const finalEqMock = jest.fn().mockResolvedValue({ error: null });
    const firstEqMock = jest.fn(() => ({ eq: finalEqMock }));
    const updateMock = jest.fn(() => ({ eq: firstEqMock }));

    supabaseFrom.mockReturnValueOnce({ update: updateMock });

    await (calendarIntegrationService as any).markSynced('user-123', 'google', 5);

    expect(getIntegrationSpy).toHaveBeenCalledWith('user-123', 'google');
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        last_synced_at: expect.any(String),
        sync_count: 7,
        updated_at: expect.any(String),
      })
    );
    expect(firstEqMock).toHaveBeenCalledWith('user_id', 'user-123');
    expect(finalEqMock).toHaveBeenCalledWith('provider', 'google');

    getIntegrationSpy.mockRestore();
  });
});
