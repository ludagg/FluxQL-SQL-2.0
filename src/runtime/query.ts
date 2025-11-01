import { parser } from '../parser/parser.js';
import { visitor } from '../parser/visitor.js';
import { SQLGenerator } from '../sql/generator.js';
import * as dialects from '../sql/dialects/index.js';
import { extendRegistry } from './extensions.js';
import { inferJoinOn } from './utils.js';
import { FluxQLLexer } from '../parser/lexer.js';

type DialectName = 'postgres' | 'mysql' | 'sqlite';

export class FluxQLQuery {
  private ast: any = {
    type: 'Query',
    from: { type: 'Table', name: '' },
    joins: [],
    filter: undefined,
    groupBy: undefined,
    aggregates: [],
    orderBy: [],
    limit: undefined,
    select: undefined,
    params: []
  };

  constructor(table: string) {
    this.ast.from.name = table;
  }

  filter(expr: string): this {
    const lexResult = FluxQLLexer.tokenize(`${this.ast.from.name}.filter(${expr})`);
    parser.input = lexResult.tokens;
    const cst = parser.query();
    if (parser.errors.length > 0) {
      throw new Error('Parsing errors detected: ' + parser.errors[0].message);
    }
    const ast = visitor.visit(cst);
    this.ast.filter = ast.filter;
    this.ast.params = ast.params;
    return this;
  }

  join(table: string): this {
    const joinOn = { type: 'Expression', left: this.ast.from.name + '.id', operator: '==', right: table + '.' + this.ast.from.name + '_id' };
    this.ast.joins.push({ type: 'Join', table: { type: 'Table', name: table }, on: joinOn });
    return this;
  }

  groupBy(field: string): this {
    this.ast.groupBy = [field];
    return this;
  }

  sum(field: string): this {
    this.ast.aggregates.push({ type: 'Aggregate', func: 'sum', field, alias: 'sum' });
    return this;
  }

  orderBy(field: string): this {
    const dir = field.startsWith('-') ? 'DESC' : 'ASC';
    this.ast.orderBy.push({ type: 'Order', field: field.replace(/^-/, ''), direction: dir });
    return this;
  }

  limit(n: number): this {
    this.ast.limit = n;
    return this;
  }

  select(fields: string): this {
    this.ast.select = { type: 'Select', fields: fields.split(',').map(f => f.trim()) };
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
        const db = new sqlite3.Database(':memory:'); // Or file path
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

// Proxy for custom extensions
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
