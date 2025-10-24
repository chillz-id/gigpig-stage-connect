import { spotAssignmentService } from '@/services/event/spot-assignment-service';
import { supabase } from '@/integrations/supabase/client';

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

const supabaseFrom = supabase.from as jest.Mock;
const supabaseRpc = supabase.rpc as jest.Mock;

describe('spotAssignmentService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('assigns a spot using the RPC helper', async () => {
    supabaseRpc.mockResolvedValueOnce({ data: { success: true }, error: null });

    const payload = {
      eventId: 'event-1',
      comedianId: 'comedian-1',
      spotType: 'headline',
      confirmationDeadlineHours: 24,
    };

    const result = await spotAssignmentService.assignViaRpc(payload);

    expect(supabaseRpc).toHaveBeenCalledWith('assign_spot_to_comedian', {
      p_event_id: 'event-1',
      p_comedian_id: 'comedian-1',
      p_spot_type: 'headline',
      p_confirmation_deadline_hours: 24,
    });
    expect(result).toEqual({ success: true });
  });

  it('throws when the RPC fails', async () => {
    supabaseRpc.mockResolvedValueOnce({
      data: null,
      error: new Error('rpc failed'),
    });

    await expect(
      spotAssignmentService.assignViaRpc({
        eventId: 'event-1',
        comedianId: 'comedian-1',
        spotType: 'headline',
        confirmationDeadlineHours: 6,
      })
    ).rejects.toThrow('rpc failed');
  });

  it('returns event summaries when found', async () => {
    const singleMock = jest.fn().mockResolvedValue({
      data: { title: 'Big Show', event_date: '2024-10-01', venue: 'Main Room' },
      error: null,
    });
    const eqMock = jest.fn(() => ({ single: singleMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));

    supabaseFrom.mockReturnValueOnce({ select: selectMock });

    const summary = await spotAssignmentService.getEventSummary('event-1');

    expect(supabaseFrom).toHaveBeenCalledWith('events');
    expect(selectMock).toHaveBeenCalledWith('title, event_date, venue');
    expect(eqMock).toHaveBeenCalledWith('id', 'event-1');
    expect(summary).toEqual({
      title: 'Big Show',
      event_date: '2024-10-01',
      venue: 'Main Room',
    });
  });

  it('returns null when the event is missing', async () => {
    const singleMock = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });
    const eqMock = jest.fn(() => ({ single: singleMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));

    supabaseFrom.mockReturnValueOnce({ select: selectMock });

    const summary = await spotAssignmentService.getEventSummary('missing-event');
    expect(summary).toBeNull();
  });

  it('throws unexpected errors when fetching summaries', async () => {
    const unexpectedError = Object.assign(new Error('unexpected'), { code: '500' });
    const singleMock = jest.fn().mockResolvedValue({
      data: null,
      error: unexpectedError,
    });
    const eqMock = jest.fn(() => ({ single: singleMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));

    supabaseFrom.mockReturnValueOnce({ select: selectMock });

    await expect(spotAssignmentService.getEventSummary('event-1')).rejects.toThrow('unexpected');
  });

  it('checks whether a comedian is already assigned', async () => {
    const maybeSingleMock = jest.fn().mockResolvedValue({
      data: { id: 'spot-1' },
      error: null,
    });
    const thirdEqMock = jest.fn(() => ({ maybeSingle: maybeSingleMock }));
    const secondEqMock = jest.fn(() => ({ eq: thirdEqMock }));
    const firstEqMock = jest.fn(() => ({ eq: secondEqMock }));
    const selectMock = jest.fn(() => ({ eq: firstEqMock }));

    supabaseFrom.mockReturnValueOnce({ select: selectMock });

    const assigned = await spotAssignmentService.isComedianAssigned('event-1', 'comedian-1');

    expect(firstEqMock).toHaveBeenCalledWith('event_id', 'event-1');
    expect(secondEqMock).toHaveBeenCalledWith('comedian_id', 'comedian-1');
    expect(thirdEqMock).toHaveBeenCalledWith('is_filled', true);
    expect(assigned).toBe(true);
  });

  it('returns false when a comedian is not assigned', async () => {
    const maybeSingleMock = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });
    const thirdEqMock = jest.fn(() => ({ maybeSingle: maybeSingleMock }));
    const secondEqMock = jest.fn(() => ({ eq: thirdEqMock }));
    const firstEqMock = jest.fn(() => ({ eq: secondEqMock }));
    const selectMock = jest.fn(() => ({ eq: firstEqMock }));

    supabaseFrom.mockReturnValueOnce({ select: selectMock });

    const assigned = await spotAssignmentService.isComedianAssigned('event-1', 'comedian-1');
    expect(assigned).toBe(false);
  });

  it('throws on unknown errors when checking assignments', async () => {
    const databaseError = Object.assign(new Error('database failed'), { code: '500' });
    const maybeSingleMock = jest.fn().mockResolvedValue({
      data: null,
      error: databaseError,
    });
    const thirdEqMock = jest.fn(() => ({ maybeSingle: maybeSingleMock }));
    const secondEqMock = jest.fn(() => ({ eq: thirdEqMock }));
    const firstEqMock = jest.fn(() => ({ eq: secondEqMock }));
    const selectMock = jest.fn(() => ({ eq: firstEqMock }));

    supabaseFrom.mockReturnValueOnce({ select: selectMock });

    await expect(
      spotAssignmentService.isComedianAssigned('event-1', 'comedian-1')
    ).rejects.toThrow('database failed');
  });

  it('finds available spots and returns the first match', async () => {
    const limitMock = jest.fn().mockResolvedValue({
      data: [{ id: 'spot-1' }],
      error: null,
    });
    const thirdEqMock = jest.fn(() => ({ limit: limitMock }));
    const secondEqMock = jest.fn(() => ({ eq: thirdEqMock }));
    const firstEqMock = jest.fn(() => ({ eq: secondEqMock }));
    const selectMock = jest.fn(() => ({ eq: firstEqMock }));

    supabaseFrom.mockReturnValueOnce({ select: selectMock });

    const available = await spotAssignmentService.findAvailableSpot('event-1', 'headline');

    expect(firstEqMock).toHaveBeenCalledWith('event_id', 'event-1');
    expect(secondEqMock).toHaveBeenCalledWith('spot_name', 'headline');
    expect(thirdEqMock).toHaveBeenCalledWith('is_filled', false);
    expect(limitMock).toHaveBeenCalledWith(1);
    expect(available).toEqual({ id: 'spot-1' });
  });

  it('returns null when no available spot is found', async () => {
    const limitMock = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const thirdEqMock = jest.fn(() => ({ limit: limitMock }));
    const secondEqMock = jest.fn(() => ({ eq: thirdEqMock }));
    const firstEqMock = jest.fn(() => ({ eq: secondEqMock }));
    const selectMock = jest.fn(() => ({ eq: firstEqMock }));

    supabaseFrom.mockReturnValueOnce({ select: selectMock });

    const available = await spotAssignmentService.findAvailableSpot('event-1', 'headline');
    expect(available).toBeNull();
  });

  it('throws when fetching available spots fails', async () => {
    const queryError = new Error('query failed');
    const limitMock = jest.fn().mockResolvedValue({
      data: null,
      error: queryError,
    });
    const thirdEqMock = jest.fn(() => ({ limit: limitMock }));
    const secondEqMock = jest.fn(() => ({ eq: thirdEqMock }));
    const firstEqMock = jest.fn(() => ({ eq: secondEqMock }));
    const selectMock = jest.fn(() => ({ eq: firstEqMock }));

    supabaseFrom.mockReturnValueOnce({ select: selectMock });

    await expect(
      spotAssignmentService.findAvailableSpot('event-1', 'headline')
    ).rejects.toThrow('query failed');
  });

  it('marks a spot as assigned with confirmation details', async () => {
    const eqMock = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn(() => ({ eq: eqMock }));

    supabaseFrom.mockReturnValueOnce({ update: updateMock });

    const deadline = new Date('2024-10-01T10:00:00.000Z');

    await spotAssignmentService.markSpotAssigned('spot-1', 'comedian-1', deadline);

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        comedian_id: 'comedian-1',
        is_filled: true,
        confirmation_status: 'pending',
        confirmation_deadline: deadline.toISOString(),
        updated_at: expect.any(String),
      })
    );
    expect(eqMock).toHaveBeenCalledWith('id', 'spot-1');
  });

  it('throws when marking a spot fails', async () => {
    const updateError = new Error('update failed');
    const eqMock = jest.fn().mockResolvedValue({
      error: updateError,
    });
    const updateMock = jest.fn(() => ({ eq: eqMock }));

    supabaseFrom.mockReturnValueOnce({ update: updateMock });

    await expect(
      spotAssignmentService.markSpotAssigned('spot-1', 'comedian-1', new Date())
    ).rejects.toThrow('update failed');
  });
});
