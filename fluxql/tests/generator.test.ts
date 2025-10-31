import { describe, it, expect } from 'vitest';
import { SQLGenerator } from '../src/sql/generator.js';
import { QueryNode } from '../src/parser/ast.js';

describe('SQL Generator', () => {
  it('generates basic SELECT with filter', () => {
    const ast: QueryNode = {
      type: 'Query',
      from: { type: 'Table', name: 'users' },
      filter: { type: 'Expression', left: 'age', operator: '>', right: '18' },
      joins: [],
      groupBy: undefined,
      aggregates: [],
      orderBy: [],
      limit: undefined,
      select: undefined,
      params: [18]
    };
    const gen = new SQLGenerator();
    const { sql, params } = gen.generate(ast);
    expect(sql).toContain('SELECT * FROM "users" WHERE ("age" > $1)');
    expect(params).toEqual([18]);
  });

  it('generates aggregation', () => {
    const ast: QueryNode = {
      type: 'Query',
      from: { type: 'Table', name: 'sales' },
      groupBy: ['region'],
      aggregates: [{ type: 'Aggregate', func: 'sum', field: 'amount', alias: 'sum' }],
      // ... other fields default
      params: []
    };
    const gen = new SQLGenerator();
    const { sql } = gen.generate(ast);
    expect(sql).toContain('SELECT SUM(amount) AS sum, "region" FROM "sales" GROUP BY "region"');
  });
});