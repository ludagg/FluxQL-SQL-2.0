import { SQLGenerator } from '../sql/generator.js';
import * as dialects from '../sql/dialects/index.js';
import { extendRegistry } from './extensions.js';
import { parseExpression } from '../parser/index.js';
import { QueryNode } from '../parser/ast.js';

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
    this.ast.filter = expression;
    // Append new params, ensuring not to overwrite existing ones
    this.ast.params.push(...params);
    return this;
  }

  limit(n: number): this {
    this.ast.limit = n;
    return this;
  }

  select(fields: string | string[]): this {
    this.ast.select = Array.isArray(fields) ? fields : fields.split(',').map(f => f.trim());
    return this;
  }

  toSQL(dialectName: DialectName = 'postgres'): { sql: string; params: any[] } {
    const gen = new SQLGenerator();
    gen.setDialect(dialects[`${dialectName}Dialect` as keyof typeof dialects]);
    return gen.generate(this.ast);
  }

  async execute(options: { connection: any; dialect?: DialectName }): Promise<any[]> {
    const { sql, params } = this.toSQL(options.dialect);
    const dialect = options.dialect || 'postgres';
    if (dialect === 'postgres') {
      const { Client } = await import('pg');
      const client = new Client(options.connection);
      await client.connect();
      const res = await client.query(sql, params);
      await client.end();
      return res.rows;
    } else if (dialect === 'mysql') {
      const mysql = await import('mysql2/promise');
      const conn = await mysql.createConnection(options.connection);
      const [rows] = await conn.execute(sql, params);
      await conn.end();
      return rows as any[];
    } else if (dialect === 'sqlite') {
      const sqlite3 = await import('sqlite3');
      return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(':memory:');
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
          db.close();
        });
      });
    }
    throw new Error(`Dialect ${dialect} not implemented`);
  }
}

const handler = {
  get(target: any, prop: string) {
    if (prop in target) return target[prop];
    return (...args: any[]) => {
      const ext = extendRegistry[prop];
      if (ext) ext(target.ast, args);
      return target;
    };
  }
};

export function fluxql(table: string): FluxQLQuery {
  return new Proxy(new FluxQLQuery(table), handler);
}
