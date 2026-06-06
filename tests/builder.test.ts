import { describe, it, expect } from 'vitest';
import { fluxql } from '../src/index.js';

describe('Fluent builder', () => {
  it('builds the full README quick-start query', () => {
    const { sql, params } = fluxql('users')
      .filter('country === "FR" && age > 18')
      .join('orders')
      .groupBy('name')
      .sum('orders.total')
      .orderBy('-sum')
      .limit(10)
      .toSQL('postgres');

    expect(sql).toBe(
      'SELECT SUM("orders"."total") AS "sum", "name" FROM "users" ' +
        'JOIN "orders" ON "users"."id" = "orders"."user_id" ' +
        'WHERE (("country" = $1) AND ("age" > $2)) ' +
        'GROUP BY "name" ORDER BY "sum" DESC LIMIT $3;'
    );
    expect(params).toEqual(['FR', 18, 10]);
  });

  it('maps == to = and != to <>', () => {
    expect(fluxql('u').filter('a == 1').toSQL().sql).toContain('("a" = $1)');
    expect(fluxql('u').filter('a != 1').toSQL().sql).toContain('("a" <> $1)');
  });

  it('quotes qualified identifiers per part', () => {
    const { sql } = fluxql('users').select('users.name').toSQL('postgres');
    expect(sql).toContain('"users"."name"');
  });

  it('combines successive filters with AND', () => {
    const { sql, params } = fluxql('u').filter('a > 1').filter('b < 2').toSQL();
    expect(sql).toContain('(("a" > $1) AND ("b" < $2))');
    expect(params).toEqual([1, 2]);
  });

  it('supports ascending and descending order', () => {
    const { sql } = fluxql('t').orderBy(['name', '-created']).toSQL();
    expect(sql).toContain('ORDER BY "name" ASC, "created" DESC');
  });

  it('supports a custom join condition', () => {
    const { sql } = fluxql('a').join('b', 'a.k = b.k').toSQL();
    expect(sql).toContain('JOIN "b" ON a.k = b.k');
  });

  it('emits dialect-specific placeholders and quoting for mysql', () => {
    const { sql } = fluxql('u').filter('a > 1').toSQL('mysql');
    expect(sql).toContain('`u`');
    expect(sql).toContain('(`a` > ?)');
  });

  it('aggregates count(*) without quoting the star', () => {
    const { sql } = fluxql('u').count().toSQL();
    expect(sql).toContain('COUNT(*) AS "count"');
  });
});
