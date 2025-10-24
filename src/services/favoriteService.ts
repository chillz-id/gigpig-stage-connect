import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;
const TABLE_NAME = 'comedian_event_favorites';

interface FavoriteRow {
  comedian_id: string;
  event_id: string;
  created_at?: string;
}

const isMissingTableError = (error: unknown) => {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '42P01';
};

export const favoriteService = {
  async listByUser(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabaseClient
        .from<FavoriteRow>(TABLE_NAME)
        .select('event_id')
        .eq('comedian_id', userId);

      if (error) {
        if (isMissingTableError(error)) {
          console.warn('[favoriteService] favorites table not found – returning empty list');
          return [];
        }

        throw error;
      }

      return (data ?? []).map((row) => row.event_id);
    } catch (error) {
      console.error('[favoriteService] listByUser failed:', error);
      return [];
    }
  },

  async add(userId: string, eventId: string): Promise<void> {
    try {
      const { error } = await supabaseClient
        .from<FavoriteRow>(TABLE_NAME)
        .insert({
          comedian_id: userId,
          event_id: eventId,
        });

      if (error && !isMissingTableError(error)) {
        throw error;
      }
    } catch (error) {
      console.error('[favoriteService] add failed:', error);
      throw error;
    }
  },

  async remove(userId: string, eventId: string): Promise<void> {
    try {
      const { error } = await supabaseClient
        .from<FavoriteRow>(TABLE_NAME)
        .delete()
        .match({ comedian_id: userId, event_id: eventId });

      if (error && !isMissingTableError(error)) {
        throw error;
      }
    } catch (error) {
      console.error('[favoriteService] remove failed:', error);
      throw error;
    }
  },

  async toggle(userId: string, eventId: string, shouldFavorite: boolean): Promise<void> {
    if (shouldFavorite) {
      await this.add(userId, eventId);
    } else {
      await this.remove(userId, eventId);
    }
  },
};

export type FavoriteService = typeof favoriteService;
