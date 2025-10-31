import { describe, it, expect } from 'vitest';
import { parser } from '../src/parser/parser.js';

describe('Parser', () => {
  it('parses simple table', () => {
    const ast = parser.parse('users');
    expect(ast.type).toBe('Query');
    expect(ast.from.name).toBe('users');
  });

  it('parses filter expression', () => {
    const ast = parser.parse('users.filter(age > 18)');
    expect(ast.filter?.operator).toBe('>');
    expect(ast.params).toEqual([18]);
  });

  it('parses logical expression', () => {
    const ast = parser.parse('users.filter(age > 18 && country == "FR")');
    expect(ast.filter?.left.operator).toBe('&&');
    expect(ast.params).toEqual([18, 'FR']);
  });
});