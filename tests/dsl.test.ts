import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser/index.js';
import { SQLGenerator } from '../src/sql/generator.js';
import { postgresDialect } from '../src/sql/dialects/index.js';

function compile(src: string): { sql: string; params: any[] } {
  const ast = parse(src);
  const gen = new SQLGenerator();
  gen.setDialect(postgresDialect);
  return gen.generate(ast);
}

describe('FluxQL DSL', () => {
  it('parses a full chained query (examples/query.fluxql)', () => {
    const { sql, params } = compile(
      'users.filter(country == "FR" && age > 18).join(orders).groupBy(name).sum(orders.total).orderBy(-sum).limit(10)'
    );
    expect(sql).toBe(
      'SELECT SUM("orders"."total") AS "sum", "name" FROM "users" ' +
        'JOIN "orders" ON "users"."id" = "orders"."user_id" ' +
        'WHERE (("country" = $1) AND ("age" > $2)) ' +
        'GROUP BY "name" ORDER BY "sum" DESC LIMIT $3;'
    );
    expect(params).toEqual(['FR', 18, 10]);
  });

  it('supports single-quoted string arguments with commas (select)', () => {
    const { sql, params } = compile("products.filter(price > 100 && stock > 0).select('name, price')");
    expect(sql).toBe('SELECT "name", "price" FROM "products" WHERE (("price" > $1) AND ("stock" > $2));');
    expect(params).toEqual([100, 0]);
  });

  it('keeps non-filter arguments out of the parameter list', () => {
    const { params } = compile("sales.groupBy('region').sum('amount').orderBy('-sum')");
    expect(params).toEqual([]);
  });
});
