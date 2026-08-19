import { describe, it, expect } from 'vitest';
import { stringToBytes32 } from '../src/utils';

describe('stringToBytes32', () => {
  it('pads short strings to exactly 32 bytes', () => {
    const bytes = stringToBytes32('hello');
    expect(bytes.length).toBe(32);
    expect(bytes[0]).toBe('h'.charCodeAt(0));
    expect(bytes[31]).toBe(0);
  });

  it('truncates long strings to exactly 32 bytes', () => {
    const bytes = stringToBytes32('this_is_a_very_long_string_that_exceeds_32_bytes_length');
    expect(bytes.length).toBe(32);
    expect(bytes[31]).toBe('_'.charCodeAt(0));
    expect(bytes[0]).toBe('t'.charCodeAt(0));
  });
});
