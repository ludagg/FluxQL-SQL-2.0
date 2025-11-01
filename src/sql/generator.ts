import { QueryNode, Dialect, ExpressionNode } from '../parser/ast.js';

const defaultDialect: Dialect = {
  quote: (id: string) => `"${id}"`,
  param: (i: number) => `$${i}`,
  aggregate: (func: string, field: string) => `${func.toUpperCase()}(${field})`
};

export class SQLGenerator {
  dialect: Dialect = defaultDialect;
  private paramIndex = 1;

  setDialect(d: Dialect) { this.dialect = d; }

  generate(ast: QueryNode): { sql: string; params: any[] } {
    this.paramIndex = 1;
    let sql = 'SELECT ';
    const params = ast.params ? [...ast.params] : [];

    // Select clause
    if (ast.select && ast.select.length > 0) {
      sql += ast.select.map(f => this.dialect.quote(f)).join(', ');
    } else if (ast.aggregates && ast.aggregates.length > 0) {
      const aggs = ast.aggregates.map(a => `${this.dialect.aggregate(a.func, a.field)} AS ${a.alias || a.func}`);
      sql += aggs.join(', ');
      if (ast.groupBy && ast.groupBy.length > 0) {
        sql += `, ${ast.groupBy.map(g => this.dialect.quote(g)).join(', ')}`;
      }
    } else {
      sql += '*';
    }

    // From clause
    sql += ` FROM ${this.dialect.quote(ast.from.name)}`;

    // Filter clause
    if (ast.filter) {
      sql += ` WHERE ${this.toExpression(ast.filter)}`;
    }

    // Group By clause (simplified)
    if (ast.groupBy && ast.groupBy.length > 0) {
      sql += ` GROUP BY ${ast.groupBy.map(g => this.dialect.quote(g)).join(', ')}`;
    }

    // Limit clause
    if (ast.limit) {
      sql += ` LIMIT ${this.dialect.param(this.paramIndex++)}`;
      params.push(ast.limit);
    }
    sql += ';';

    return { sql, params };
  }

  private toExpression(expr: ExpressionNode): string {
    switch (expr.type) {
      case 'Identifier':
        return this.dialect.quote(expr.name);
      case 'Literal':
        return this.dialect.param(this.paramIndex++);
      case 'BinaryExpression':
      case 'LogicalExpression': {
        const leftStr = this.toExpression(expr.left);
        const rightStr = this.toExpression(expr.right);
        const operator = expr.operator === '&&' ? 'AND' : expr.operator === '||' ? 'OR' : expr.operator;
        return `(${leftStr} ${operator} ${rightStr})`;
      }
      default:
        const exhaustiveCheck: never = expr;
        throw new Error(`Unhandled expression type: ${(exhaustiveCheck as any).type}`);
    }
  }
}
