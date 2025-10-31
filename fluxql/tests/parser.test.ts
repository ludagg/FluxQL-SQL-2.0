import { describe, it, expect } from 'vitest';
import { flowql } from '../src/index';

describe('parser', () => {
  it('should return a greeting', () => {
    expect(flowql('world')).toBe('Hello, world!');
  });
});
