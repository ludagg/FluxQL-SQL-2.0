import { describe, it, expect } from 'vitest';
import { SQLGenerator } from '../src/sql/generator.js';
import { QueryNode } from '../src/parser/ast.js';

describe('SQL Generator', () => {
  it('generates basic SELECT with filter', () => {
    const ast: QueryNode = {
      type: 'Query',
      from: { type: 'Identifier', name: 'users' },
      filter: {
        type: 'BinaryExpression',
        operator: '>',
        left: { type: 'Identifier', name: 'age' },
        right: { type: 'Literal', value: 18 }
      },
      select: undefined,
      params: [18]
    };
    const gen = new SQLGenerator();
    const { sql, params } = gen.generate(ast);
    expect(sql).toContain('SELECT * FROM "users" WHERE ("age" > $1);');
    expect(params).toEqual([18]);
  });

  it('generates aggregation', () => {
    const ast: QueryNode = {
      type: 'Query',
      from: { type: 'Identifier', name: 'sales' },
      groupBy: ['region'],
      aggregates: [{ type: 'Aggregate', func: 'sum', field: 'amount', alias: 'sum' }],
      filter: undefined,
      select: undefined,
      params: []
    };
    const gen = new SQLGenerator();
    const { sql } = gen.generate(ast);
    expect(sql).toContain('SELECT SUM("amount") AS "sum", "region" FROM "sales" GROUP BY "region";');
  });
});
