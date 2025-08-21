// Simple unit test to verify Jest is working correctly
describe('Jest Unit Testing', () => {
  test('should be able to run basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toContain('hell');
    expect([1, 2, 3]).toHaveLength(3);
  });

  test('should be able to create simple DOM elements', () => {
    const div = document.createElement('div');
    div.textContent = 'Test Content';
    expect(div.textContent).toBe('Test Content');
  });

  test('should be able to work with objects and arrays', () => {
    const testObject = { name: 'Stand Up Sydney', type: 'comedy platform' };
    expect(testObject).toHaveProperty('name');
    expect(testObject.name).toBe('Stand Up Sydney');
    
    const testArray = ['comedian', 'promoter', 'admin'];
    expect(testArray).toContain('comedian');
    expect(testArray).toHaveLength(3);
  });
});