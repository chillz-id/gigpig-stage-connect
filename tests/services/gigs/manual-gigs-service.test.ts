import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const fromMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('manualGigsService', () => {
  const { manualGigsService } = require('@/services/gigs/manual-gigs-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserManualGigs', () => {
    it('should fetch user manual gigs ordered by start date', async () => {
      const mockData = [
        {
          id: 'gig-1',
          user_id: 'user-123',
          title: 'Comedy Night',
          venue_name: 'The Comedy Store',
          venue_address: '1 Comedy Ln',
          start_datetime: '2025-11-15T20:00:00Z',
          end_datetime: '2025-11-15T22:00:00Z',
          notes: 'Bring mic',
          created_at: '2025-10-29T10:00:00Z',
          updated_at: '2025-10-29T10:00:00Z'
        }
      ];

      const orderMock = jest.fn().mockResolvedValue({
        data: mockData,
        error: null
      });
      const eqMock = jest.fn().mockReturnValue({
        order: orderMock
      });
      const selectMock = jest.fn().mockReturnValue({
        eq: eqMock
      });
      fromMock.mockReturnValue({ select: selectMock });

      const result = await manualGigsService.getUserManualGigs('user-123');

      expect(fromMock).toHaveBeenCalledWith('manual_gigs');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('user_id', 'user-123');
      expect(orderMock).toHaveBeenCalledWith('start_datetime', { ascending: true });
      expect(result).toEqual(mockData);
    });

    it('should throw on database error', async () => {
      const error = new Error('Database error');
      const orderMock = jest.fn().mockResolvedValue({
        data: null,
        error: error
      });
      const eqMock = jest.fn().mockReturnValue({
        order: orderMock
      });
      const selectMock = jest.fn().mockReturnValue({
        eq: eqMock
      });
      fromMock.mockReturnValue({ select: selectMock });

      await expect(
        manualGigsService.getUserManualGigs('user-123')
      ).rejects.toThrow('Database error');
    });

    it('should return empty array when no gigs found', async () => {
      const orderMock = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });
      const eqMock = jest.fn().mockReturnValue({
        order: orderMock
      });
      const selectMock = jest.fn().mockReturnValue({
        eq: eqMock
      });
      fromMock.mockReturnValue({ select: selectMock });

      const result = await manualGigsService.getUserManualGigs('user-123');
      expect(result).toEqual([]);
    });
  });

  describe('createManualGig', () => {
    it('should create a new manual gig', async () => {
      const newGig = {
        user_id: 'user-123',
        title: 'Open Mic Night',
        venue_name: 'The Laugh Factory',
        venue_address: null,
        start_datetime: '2025-11-20T19:00:00Z',
        end_datetime: null,
        notes: null
      };

      const createdGig = {
        ...newGig,
        id: 'gig-new',
        created_at: '2025-10-29T10:00:00Z',
        updated_at: '2025-10-29T10:00:00Z'
      };

      const singleMock = jest.fn().mockResolvedValue({
        data: createdGig,
        error: null
      });
      const selectMock = jest.fn().mockReturnValue({
        single: singleMock
      });
      const insertMock = jest.fn().mockReturnValue({
        select: selectMock
      });
      fromMock.mockReturnValue({ insert: insertMock });

      const result = await manualGigsService.createManualGig(newGig);

      expect(fromMock).toHaveBeenCalledWith('manual_gigs');
      expect(insertMock).toHaveBeenCalledWith(newGig);
      expect(result).toEqual(createdGig);
    });

    it('should throw on insert error', async () => {
      const newGig = {
        user_id: 'user-123',
        title: 'Test Gig',
        venue_name: null,
        venue_address: null,
        start_datetime: '2025-11-20T19:00:00Z',
        end_datetime: null,
        notes: null
      };

      const error = new Error('Insert failed');
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: error
      });
      const selectMock = jest.fn().mockReturnValue({
        single: singleMock
      });
      const insertMock = jest.fn().mockReturnValue({
        select: selectMock
      });
      fromMock.mockReturnValue({ insert: insertMock });

      await expect(
        manualGigsService.createManualGig(newGig)
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('updateManualGig', () => {
    it('should update an existing manual gig', async () => {
      const updates = {
        title: 'Updated Title',
        venue_name: 'New Venue'
      };

      const updatedGig = {
        id: 'gig-1',
        user_id: 'user-123',
        title: 'Updated Title',
        venue_name: 'New Venue',
        venue_address: null,
        start_datetime: '2025-11-20T19:00:00Z',
        end_datetime: null,
        notes: null,
        created_at: '2025-10-29T10:00:00Z',
        updated_at: '2025-10-29T11:00:00Z'
      };

      const singleMock = jest.fn().mockResolvedValue({
        data: updatedGig,
        error: null
      });
      const selectMock = jest.fn().mockReturnValue({
        single: singleMock
      });
      const eqMock = jest.fn().mockReturnValue({
        select: selectMock
      });
      const updateMock = jest.fn().mockReturnValue({
        eq: eqMock
      });
      fromMock.mockReturnValue({ update: updateMock });

      const result = await manualGigsService.updateManualGig('gig-1', updates);

      expect(fromMock).toHaveBeenCalledWith('manual_gigs');
      expect(updateMock).toHaveBeenCalledWith(updates);
      expect(eqMock).toHaveBeenCalledWith('id', 'gig-1');
      expect(result).toEqual(updatedGig);
    });

    it('should throw on update error', async () => {
      const error = new Error('Update failed');
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: error
      });
      const selectMock = jest.fn().mockReturnValue({
        single: singleMock
      });
      const eqMock = jest.fn().mockReturnValue({
        select: selectMock
      });
      const updateMock = jest.fn().mockReturnValue({
        eq: eqMock
      });
      fromMock.mockReturnValue({ update: updateMock });

      await expect(
        manualGigsService.updateManualGig('gig-1', { title: 'New' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteManualGig', () => {
    it('should delete a manual gig', async () => {
      const eqMock = jest.fn().mockResolvedValue({
        error: null
      });
      const deleteMock = jest.fn().mockReturnValue({
        eq: eqMock
      });
      fromMock.mockReturnValue({ delete: deleteMock });

      await manualGigsService.deleteManualGig('gig-1');

      expect(fromMock).toHaveBeenCalledWith('manual_gigs');
      expect(eqMock).toHaveBeenCalledWith('id', 'gig-1');
    });

    it('should throw on delete error', async () => {
      const error = new Error('Delete failed');
      const eqMock = jest.fn().mockResolvedValue({
        error: error
      });
      const deleteMock = jest.fn().mockReturnValue({
        eq: eqMock
      });
      fromMock.mockReturnValue({ delete: deleteMock });

      await expect(
        manualGigsService.deleteManualGig('gig-1')
      ).rejects.toThrow('Delete failed');
    });
  });
});
