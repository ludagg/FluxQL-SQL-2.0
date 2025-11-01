import { describe, it, expect } from 'vitest';
import { parser } from '../src/parser/parser.js';
import { visitor } from '../src/parser/visitor.js';
import { FluxQLLexer } from '../src/parser/lexer.js';

describe('Parser', () => {
  it('parses simple table', () => {
    const lexResult = FluxQLLexer.tokenize('users');
    parser.input = lexResult.tokens;
    const cst = parser.query();
    const ast = visitor.visit(cst);
    expect(ast.type).toBe('Query');
    expect(ast.from.name).toBe('users');
  });

  it('parses filter expression', () => {
    const lexResult = FluxQLLexer.tokenize('users.filter(age > 18)');
    parser.input = lexResult.tokens;
    const cst = parser.query();
    const ast = visitor.visit(cst);
    expect(ast.filter?.operator).toBe('>');
    expect(ast.params).toEqual([18]);
  });

  it('parses logical expression', () => {
    const lexResult = FluxQLLexer.tokenize('users.filter(age > 18 && country == "FR")');
    parser.input = lexResult.tokens;
    const cst = parser.query();
    const ast = visitor.visit(cst);
    expect(ast.filter?.operator).toBe('&&');
    expect(ast.params).toEqual([18, 'FR']);
  });
});
