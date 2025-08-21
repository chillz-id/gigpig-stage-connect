import { debounce } from '@/utils/debounce';

describe('debounce utility', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1', 'arg2');
    
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should debounce multiple calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('first');
    jest.advanceTimersByTime(50);
    
    debouncedFn('second');
    jest.advanceTimersByTime(50);
    
    debouncedFn('third');
    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('third');
  });

  it('should cancel pending execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg');
    jest.advanceTimersByTime(50);
    
    debouncedFn.cancel();
    jest.advanceTimersByTime(50);

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should flush pending execution immediately', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1', 'arg2');
    
    expect(mockFn).not.toHaveBeenCalled();
    
    debouncedFn.flush();
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    
    // Advancing time should not cause another call
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle flush when no pending execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    // Flush without any pending calls
    debouncedFn.flush();
    expect(mockFn).not.toHaveBeenCalled();

    // Call, wait for execution, then flush
    debouncedFn('arg');
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
    
    debouncedFn.flush();
    expect(mockFn).toHaveBeenCalledTimes(1); // No additional calls
  });

  it('should handle cancel when no pending execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    // Cancel without any pending calls
    debouncedFn.cancel();
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should work with functions returning values', () => {
    const mockFn = jest.fn(() => 'return value');
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalled();
    expect(mockFn).toHaveReturnedWith('return value');
  });

  it('should preserve this context', () => {
    const obj = {
      value: 42,
      getValue: jest.fn(function(this: any) {
        return this.value;
      })
    };

    const debouncedGetValue = debounce(obj.getValue.bind(obj), 100);
    
    debouncedGetValue();
    jest.advanceTimersByTime(100);

    expect(obj.getValue).toHaveBeenCalled();
    expect(obj.getValue).toHaveReturnedWith(42);
  });

  it('should handle rapid successive calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    // Rapid calls
    for (let i = 0; i < 10; i++) {
      debouncedFn(i);
      jest.advanceTimersByTime(10);
    }

    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(9); // Last call value
  });

  it('should allow multiple independent debounced functions', () => {
    const mockFn1 = jest.fn();
    const mockFn2 = jest.fn();
    
    const debouncedFn1 = debounce(mockFn1, 100);
    const debouncedFn2 = debounce(mockFn2, 200);

    debouncedFn1('fn1');
    debouncedFn2('fn2');

    jest.advanceTimersByTime(100);
    
    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn1).toHaveBeenCalledWith('fn1');
    expect(mockFn2).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    
    expect(mockFn2).toHaveBeenCalledTimes(1);
    expect(mockFn2).toHaveBeenCalledWith('fn2');
  });

  it('should handle edge case with 0ms delay', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 0);

    debouncedFn('immediate');
    
    // Even with 0ms, setTimeout is used
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(0);
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('immediate');
  });
});