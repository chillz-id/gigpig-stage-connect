import { describe, it, expect } from '@jest/globals';
import { supabase } from '@/integrations/supabase/client';

describe('Ticket Sales Smoke Test', () => {
  it('should have ticket_sales table', async () => {
    const { error } = await supabase
      .from('ticket_sales')
      .select('id')
      .limit(1);

    // Table should exist
    expect(error?.code).not.toBe('42P01'); // Table does not exist error
  });

  it('should have ticket_platforms table', async () => {
    const { error } = await supabase
      .from('ticket_platforms')
      .select('id')
      .limit(1);

    // Table should exist
    expect(error?.code).not.toBe('42P01');
  });

  it('should have webhook_logs table', async () => {
    const { error } = await supabase
      .from('webhook_logs')
      .select('id')
      .limit(1);

    // Table should exist
    expect(error?.code).not.toBe('42P01');
  });
});