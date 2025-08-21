import { ApplicationFormData, SpotType } from '@/types/application';

describe('Application Enhancement', () => {
  it('should have the correct ApplicationFormData structure', () => {
    const mockData: ApplicationFormData = {
      event_id: 'test-event-id',
      message: 'Test message',
      spot_type: 'Feature',
      availability_confirmed: true,
      requirements_acknowledged: true,
    };

    expect(mockData.event_id).toBe('test-event-id');
    expect(mockData.message).toBe('Test message');
    expect(mockData.spot_type).toBe('Feature');
    expect(mockData.availability_confirmed).toBe(true);
    expect(mockData.requirements_acknowledged).toBe(true);
  });

  it('should have correct SpotType values', () => {
    const spotTypes: SpotType[] = ['MC', 'Feature', 'Headliner', 'Guest'];
    
    spotTypes.forEach(spotType => {
      expect(['MC', 'Feature', 'Headliner', 'Guest']).toContain(spotType);
    });
  });
});