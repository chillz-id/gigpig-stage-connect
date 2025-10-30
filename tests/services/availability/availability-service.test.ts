import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const fromMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('availabilityService', () => {
  const { availabilityService } = require('@/services/availability/availability-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserAvailability', () => {
    it('should fetch user availability as Set of event IDs', async () => {
      const mockData = [
        { event_id: 'event-1' },
        { event_id: 'event-2' },
        { event_id: 'event-3' }
      ];

      const eqMock = jest.fn().mockResolvedValue({
        data: mockData,
        error: null
      });
      const selectMock = jest.fn().mockReturnValue({
        eq: eqMock
      });
      fromMock.mockReturnValue({ select: selectMock });

      const result = await availabilityService.getUserAvailability('user-123');

      expect(fromMock).toHaveBeenCalledWith('comedian_availability');
      expect(selectMock).toHaveBeenCalledWith('event_id');
      expect(eqMock).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toEqual(new Set(['event-1', 'event-2', 'event-3']));
    });

    it('should throw on Supabase error', async () => {
      const error = new Error('Database error');
      const eqMock = jest.fn().mockResolvedValue({
        data: null,
        error: error
      });
      const selectMock = jest.fn().mockReturnValue({
        eq: eqMock
      });
      fromMock.mockReturnValue({ select: selectMock });

      await expect(
        availabilityService.getUserAvailability('user-123')
      ).rejects.toThrow('Database error');
    });
  });

  describe('batchUpdateAvailability', () => {
    it('should delete removed events', async () => {
      const inMock = jest.fn().mockResolvedValue({ error: null });
      const eqMock = jest.fn().mockReturnValue({
        in: inMock
      });
      const deleteMock = jest.fn().mockReturnValue({
        eq: eqMock
      });
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      fromMock.mockReturnValue({
        delete: deleteMock,
        insert: insertMock
      });

      await availabilityService.batchUpdateAvailability(
        'user-123',
        new Set(['event-1']),
        new Set()
      );

      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('user_id', 'user-123');
      expect(inMock).toHaveBeenCalledWith('event_id', ['event-1']);
    });

    it('should insert added events', async () => {
      const inMock = jest.fn().mockResolvedValue({ error: null });
      const eqMock = jest.fn().mockReturnValue({
        in: inMock
      });
      const deleteMock = jest.fn().mockReturnValue({
        eq: eqMock
      });
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      fromMock.mockReturnValue({
        delete: deleteMock,
        insert: insertMock
      });

      await availabilityService.batchUpdateAvailability(
        'user-123',
        new Set(),
        new Set(['event-2', 'event-3'])
      );

      expect(insertMock).toHaveBeenCalledWith([
        { user_id: 'user-123', event_id: 'event-2' },
        { user_id: 'user-123', event_id: 'event-3' }
      ]);
    });
  });

  describe('toggleEvent', () => {
    it('should insert event when isSelected is true', async () => {
      const insertMock = jest.fn().mockResolvedValue({ error: null });
      fromMock.mockReturnValue({ insert: insertMock });

      await availabilityService.toggleEvent('user-123', 'event-1', true);

      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user-123',
        event_id: 'event-1'
      });
    });

    it('should delete event when isSelected is false', async () => {
      const eqEventMock = jest.fn().mockResolvedValue({ error: null });
      const eqUserMock = jest.fn().mockReturnValue({ eq: eqEventMock });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      fromMock.mockReturnValue({ delete: deleteMock });

      await availabilityService.toggleEvent('user-123', 'event-1', false);

      expect(deleteMock).toHaveBeenCalled();
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-123');
      expect(eqEventMock).toHaveBeenCalledWith('event_id', 'event-1');
    });

    it('should ignore duplicate key errors (23505)', async () => {
      const duplicateError = { code: '23505', message: 'duplicate key' };
      const insertMock = jest.fn().mockResolvedValue({ error: duplicateError });
      fromMock.mockReturnValue({ insert: insertMock });

      await expect(
        availabilityService.toggleEvent('user-123', 'event-1', true)
      ).resolves.not.toThrow();
    });

    it('should throw non-duplicate errors', async () => {
      const otherError = new Error('Network error');
      const insertMock = jest.fn().mockResolvedValue({ error: otherError });
      fromMock.mockReturnValue({ insert: insertMock });

      await expect(
        availabilityService.toggleEvent('user-123', 'event-1', true)
      ).rejects.toThrow('Network error');
    });
  });
});
