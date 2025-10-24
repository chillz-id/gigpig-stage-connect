import { profileService } from '@/services/profile';
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

describe('profileService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches profile by id', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: 'user-1' }, error: null });
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));

    supabaseFrom.mockReturnValueOnce({ select });

    const result = await profileService.getProfileById('user-1');

    expect(supabaseFrom).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith(expect.stringContaining('profile_slug'));
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    expect(result).toEqual({ id: 'user-1' });
  });

  it('generates unique slug when name already taken', async () => {
    const existing = { data: { id: 'someone-else' }, error: null };
    const available = { data: null, error: { code: 'PGRST116' } };

    const chainFor = (response: any) => {
      const maybeSingle = jest.fn().mockResolvedValue(response);
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            limit: jest.fn(() => ({ maybeSingle })),
            maybeSingle,
          })),
        })),
      };
    };

    supabaseFrom
      .mockReturnValueOnce(chainFor(existing))
      .mockReturnValueOnce(chainFor(available));

    const slug = await profileService.generateUniqueSlug('Test Name');

    expect(slug.endsWith('-1')).toBe(true);
  });

  it('updates profile with timestamp', async () => {
    const eqMock = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn(() => ({ eq: eqMock }));

    supabaseFrom.mockReturnValueOnce({ update: updateMock });

    await profileService.updateProfile('user-1', { name: 'Updated User' });

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated User',
        updated_at: expect.any(String),
      })
    );
    expect(eqMock).toHaveBeenCalledWith('id', 'user-1');
  });

  it('lists interests ordered by created_at desc', async () => {
    const orderMock = jest.fn().mockResolvedValue({ data: [{ id: 'interest-1' }], error: null });
    const eqMock = jest.fn(() => ({ order: orderMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));

    supabaseFrom.mockReturnValueOnce({ select: selectMock });

    const interests = await profileService.listInterests('user-1');

    expect(supabaseFrom).toHaveBeenCalledWith('user_interests');
    expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1');
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(interests).toEqual([{ id: 'interest-1' }]);
  });
});
