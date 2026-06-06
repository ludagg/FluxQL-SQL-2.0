import { QueryNode, Dialect, ExpressionNode, JoinNode } from '../parser/ast.js';
import { inferJoinOn } from '../runtime/utils.js';

const defaultDialect: Dialect = {
  quote: (id: string) => `"${id}"`,
  param: (i: number) => `$${i}`,
  aggregate: (func: string, field: string) => `${func.toUpperCase()}(${field})`
};

/** Maps FluxQL/JS comparison operators to their SQL equivalents. */
const OPERATOR_MAP: Record<string, string> = {
  '==': '=',
  '===': '=',
  '!=': '<>',
  '!==': '<>',
  '<>': '<>',
  '&&': 'AND',
  '||': 'OR'
};

export class SQLGenerator {
  dialect: Dialect = defaultDialect;
  private paramIndex = 1;

  setDialect(d: Dialect) { this.dialect = d; }

  generate(ast: QueryNode): { sql: string; params: any[] } {
    this.paramIndex = 1;
    let sql = 'SELECT ';
    const params = ast.params ? [...ast.params] : [];

    // Select clause: explicit columns and/or aggregates.
    const selectParts: string[] = [];
    if (ast.select && ast.select.length > 0) {
      selectParts.push(...ast.select.map(f => this.quoteId(f)));
    }
    if (ast.aggregates && ast.aggregates.length > 0) {
      selectParts.push(
        ...ast.aggregates.map(a => {
          const field = a.field === '*' ? '*' : this.quoteId(a.field);
          const alias = a.alias || a.func;
          return `${this.dialect.aggregate(a.func, field)} AS ${this.dialect.quote(alias)}`;
        })
      );
      // When grouping without an explicit projection, surface the grouped columns.
      if ((!ast.select || ast.select.length === 0) && ast.groupBy && ast.groupBy.length > 0) {
        selectParts.push(...ast.groupBy.map(g => this.quoteId(g)));
      }
    }
    sql += selectParts.length > 0 ? selectParts.join(', ') : '*';

    // From clause.
    sql += ` FROM ${this.quoteId(ast.from.name)}`;

    // Join clauses.
    if (ast.joins && ast.joins.length > 0) {
      for (const join of ast.joins) {
        sql += ` JOIN ${this.quoteId(join.table)} ON ${this.joinOn(ast.from.name, join)}`;
      }
    }

    // Filter clause.
    if (ast.filter) {
      sql += ` WHERE ${this.toExpression(ast.filter)}`;
    }

    // Group By clause.
    if (ast.groupBy && ast.groupBy.length > 0) {
      sql += ` GROUP BY ${ast.groupBy.map(g => this.quoteId(g)).join(', ')}`;
    }

    // Order By clause.
    if (ast.orderBy && ast.orderBy.length > 0) {
      sql += ` ORDER BY ${ast.orderBy.map(o => `${this.quoteId(o.field)} ${o.direction}`).join(', ')}`;
    }

    // Limit clause.
    if (ast.limit !== undefined) {
      sql += ` LIMIT ${this.dialect.param(this.paramIndex++)}`;
      params.push(ast.limit);
    }
    sql += ';';

    return { sql, params };
  }

  /** Quotes a possibly-qualified identifier ("users.name" -> "users"."name"). */
  private quoteId(id: string): string {
    if (id === '*') return '*';
    return id
      .split('.')
      .map(part => (part === '*' ? '*' : this.dialect.quote(part)))
      .join('.');
  }

  private joinOn(fromTable: string, join: JoinNode): string {
    if (join.on) return join.on;
    const { left, right } = inferJoinOn(fromTable, join.table);
    return `${this.quoteId(left)} = ${this.quoteId(right)}`;
  }

  private toExpression(expr: ExpressionNode): string {
    switch (expr.type) {
      case 'Identifier':
        return this.quoteId(expr.name);
      case 'Literal':
        return this.dialect.param(this.paramIndex++);
      case 'UnaryExpression':
        return `${expr.operator}${this.toExpression(expr.argument)}`;
      case 'BinaryExpression':
      case 'LogicalExpression': {
        const leftStr = this.toExpression(expr.left);
        const rightStr = this.toExpression(expr.right);
        const operator = OPERATOR_MAP[expr.operator] ?? expr.operator;
        return `(${leftStr} ${operator} ${rightStr})`;
      }
      default:
        const exhaustiveCheck: never = expr;
        throw new Error(`Unhandled expression type: ${(exhaustiveCheck as any).type}`);
    }
  }
}
