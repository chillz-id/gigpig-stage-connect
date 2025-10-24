const fromMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('contactService', () => {
  const { contactService } = require('@/services/crm/contact-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps profiles to CRM contact shape', async () => {
    const orderMock = jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ data: [
      {
        id: '1',
        full_name: 'Alice Example',
        company_name: 'Example Co',
        contact_email: 'alice@example.com',
        contact_phone: '123',
        avatar_url: null,
        location: 'Sydney',
        website_url: null,
        service_areas: ['NSW'],
        specialties: ['Comedy'],
        social_media_links: { instagram: 'alice' },
        updated_at: '2024-09-01',
        promoter_stats: { total_events_hosted: 5, success_rate: 0.9, average_attendance: 200 },
      },
    ], error: null }) });

    const eqMock = jest.fn().mockReturnValue({ order: orderMock });
    const selectMock = jest.fn(() => ({ eq: eqMock }));
    fromMock.mockReturnValue({ select: selectMock });

    const result = await contactService.list({ role: 'organizer', limit: 10 });

    expect(fromMock).toHaveBeenCalledWith('profiles');
    expect(selectMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('user_roles.role', 'organizer');
    expect(result[0]).toMatchObject({
      id: '1',
      name: 'Alice Example',
      company: 'Example Co',
      totalEventsHosted: 5,
      successRate: 0.9,
    });
  });

  it('applies search term and propagates errors', async () => {
    const failure = new Error('boom');
    const builder: any = {
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnValue({ data: null, error: failure }),
    };
    const eqMock = jest.fn().mockReturnValue(builder);
    const selectMock = jest.fn(() => ({ eq: eqMock }));
    fromMock.mockReturnValue({ select: selectMock });

    await expect(contactService.list({ role: 'sponsor', search: 'gigpig' })).rejects.toThrow('boom');
    expect(builder.order).toHaveBeenCalled();
    expect(builder.or).toHaveBeenCalled();
  });
});
