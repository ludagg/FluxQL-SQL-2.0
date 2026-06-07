import { SQLGenerator } from '../sql/generator.js';
import * as dialects from '../sql/dialects/index.js';
import { extendRegistry } from './extensions.js';
import { parseExpression } from '../parser/index.js';
import { OrderByNode, QueryNode } from '../parser/ast.js';

type DialectName = 'postgres' | 'mysql' | 'sqlite';

export class FluxQLQuery {
  private ast: QueryNode = {
    type: 'Query',
    from: { type: 'Identifier', name: '' },
    filter: undefined,
    params: []
  };

  constructor(table: string) {
    this.ast.from.name = table;
  }

  filter(expr: string): this {
    const { expression, params } = parseExpression(expr);
    // Combine successive filters with AND, preserving parameter order.
    this.ast.filter = this.ast.filter
      ? { type: 'LogicalExpression', operator: '&&', left: this.ast.filter, right: expression }
      : expression;
    this.ast.params.push(...params);
    return this;
  }

  select(fields: string | string[]): this {
    const list = Array.isArray(fields) ? fields : fields.split(',');
    const cleaned = list.map(f => f.trim()).filter(Boolean);
    this.ast.select = [...(this.ast.select ?? []), ...cleaned];
    return this;
  }

  join(table: string, on?: string): this {
    (this.ast.joins ??= []).push({ type: 'Join', table, ...(on ? { on } : {}) });
    return this;
  }

  groupBy(fields: string | string[]): this {
    const list = Array.isArray(fields) ? fields : fields.split(',');
    const cleaned = list.map(f => f.trim()).filter(Boolean);
    this.ast.groupBy = [...(this.ast.groupBy ?? []), ...cleaned];
    return this;
  }

  /** Generic aggregate helper. Defaults the alias to the function name. */
  aggregate(func: string, field: string = '*', alias?: string): this {
    (this.ast.aggregates ??= []).push({
      type: 'Aggregate',
      func,
      field,
      alias: alias ?? func
    });
    return this;
  }

  sum(field: string, alias?: string): this { return this.aggregate('sum', field, alias); }
  avg(field: string, alias?: string): this { return this.aggregate('avg', field, alias); }
  min(field: string, alias?: string): this { return this.aggregate('min', field, alias); }
  max(field: string, alias?: string): this { return this.aggregate('max', field, alias); }
  count(field: string = '*', alias?: string): this { return this.aggregate('count', field, alias); }

  orderBy(spec: string | string[]): this {
    const specs = Array.isArray(spec) ? spec : [spec];
    const parsed: OrderByNode[] = specs
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        const desc = s.startsWith('-');
        return {
          type: 'OrderBy' as const,
          field: desc ? s.slice(1).trim() : s,
          direction: desc ? ('DESC' as const) : ('ASC' as const)
        };
      });
    this.ast.orderBy = [...(this.ast.orderBy ?? []), ...parsed];
    return this;
  }

  limit(n: number): this {
    this.ast.limit = n;
    return this;
  }

  toSQL(dialectName: DialectName = 'postgres'): { sql: string; params: any[] } {
    const gen = new SQLGenerator();
    gen.setDialect(dialects[`${dialectName}Dialect` as keyof typeof dialects]);
    return gen.generate(this.ast);
  }

  async execute(options: { connection: any; dialect?: DialectName }): Promise<any[]> {
    const dialect = options.dialect || 'postgres';
    const { sql, params } = this.toSQL(dialect);

    if (dialect === 'postgres') {
      // Reuse an existing Pool/Client (anything exposing query()) when provided.
      if (options.connection && typeof options.connection.query === 'function') {
        const res = await options.connection.query(sql, params);
        return res.rows;
      }
      const { Client } = await import('pg');
      const client = new Client(options.connection);
      await client.connect();
      try {
        const res = await client.query(sql, params);
        return res.rows;
      } finally {
        await client.end();
      }
    }

    if (dialect === 'mysql') {
      const mysql = await import('mysql2/promise');
      const conn = await mysql.createConnection(options.connection);
      try {
        const [rows] = await conn.execute(sql, params);
        return rows as any[];
      } finally {
        await conn.end();
      }
    }

    if (dialect === 'sqlite') {
      const sqlite3 = await import('sqlite3');
      const lib: any = (sqlite3 as any).default ?? sqlite3;
      const file = typeof options.connection === 'string' ? options.connection : ':memory:';
      return new Promise((resolve, reject) => {
        const db = new lib.Database(file);
        db.all(sql, params, (err: Error | null, rows: any[]) => {
          db.close();
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }

    throw new Error(`Dialect ${dialect} not implemented`);
  }
}

const handler = {
  get(target: any, prop: string, receiver: any) {
    if (prop in target) return Reflect.get(target, prop, target);
    // Dynamic extensions registered via extend().
    return (...args: any[]) => {
      const ext = extendRegistry[prop];
      if (ext) ext(target.ast, args);
      return receiver;
    };
  }
};

export function fluxql(table: string): FluxQLQuery {
  return new Proxy(new FluxQLQuery(table), handler);
}
