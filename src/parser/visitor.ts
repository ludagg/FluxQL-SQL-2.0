import { parser } from './parser.js';
import {
  AggregateNode,
  ExpressionNode,
  JoinNode,
  OrderByNode,
  QueryNode
} from './ast.js';

const BaseFluxQLVisitor = parser.getBaseCstVisitorConstructor();

const AGGREGATE_METHODS = new Set(['sum', 'count', 'avg', 'min', 'max']);

/** Extracts a plain field/table name from a parsed argument node. */
function nameOf(node: ExpressionNode): string {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'Literal') return String(node.value);
  if (node.type === 'UnaryExpression') return nameOf(node.argument);
  throw new Error(`Expected a name argument, got ${node.type}`);
}

class FluxQLVisitor extends BaseFluxQLVisitor {
  public params: any[];

  constructor() {
    super();
    this.params = [];
    this.validateVisitor();
  }

  query(ctx: any): QueryNode {
    this.params = [];
    const table = ctx.Identifier[0].image;

    const ast: QueryNode = {
      type: 'Query',
      from: { type: 'Identifier', name: table },
      params: this.params
    };

    const methodCalls = ctx.methodCall ?? [];
    for (const mc of methodCalls) {
      const { method, args } = this.visit(mc) as { method: string; args: ExpressionNode[] };
      this.applyMethod(ast, method, args);
    }

    ast.params = this.params;
    return ast;
  }

  private applyMethod(ast: QueryNode, method: string, args: ExpressionNode[]): void {
    switch (method) {
      case 'filter': {
        const expr = args[0];
        ast.filter = ast.filter
          ? { type: 'LogicalExpression', operator: '&&', left: ast.filter, right: expr }
          : expr;
        break;
      }
      case 'select': {
        const fields = args.flatMap(a => nameOf(a).split(',').map(f => f.trim())).filter(Boolean);
        ast.select = [...(ast.select ?? []), ...fields];
        break;
      }
      case 'join': {
        const join: JoinNode = { type: 'Join', table: nameOf(args[0]) };
        if (args[1]) join.on = nameOf(args[1]);
        (ast.joins ??= []).push(join);
        break;
      }
      case 'groupBy': {
        const fields = args.flatMap(a => nameOf(a).split(',').map(f => f.trim())).filter(Boolean);
        ast.groupBy = [...(ast.groupBy ?? []), ...fields];
        break;
      }
      case 'orderBy': {
        (ast.orderBy ??= []).push(...args.map(a => this.toOrderBy(a)));
        break;
      }
      case 'limit': {
        ast.limit = Number(nameOf(args[0]));
        break;
      }
      default: {
        if (AGGREGATE_METHODS.has(method)) {
          const field = args[0] ? nameOf(args[0]) : '*';
          const alias = args[1] ? nameOf(args[1]) : method;
          const agg: AggregateNode = { type: 'Aggregate', func: method, field, alias };
          (ast.aggregates ??= []).push(agg);
        }
        // Unknown methods (e.g. user extensions) are ignored by the static parser.
        break;
      }
    }
  }

  private toOrderBy(node: ExpressionNode): OrderByNode {
    // `-field` (unary minus) or `'-field'` (string) means descending.
    if (node.type === 'UnaryExpression' && node.operator === '-') {
      return { type: 'OrderBy', field: nameOf(node.argument), direction: 'DESC' };
    }
    const name = nameOf(node);
    if (name.startsWith('-')) {
      return { type: 'OrderBy', field: name.slice(1), direction: 'DESC' };
    }
    return { type: 'OrderBy', field: name, direction: 'ASC' };
  }

  expression(ctx: any): ExpressionNode {
    return this.visit(ctx.logicalOrExpr);
  }

  methodCall(ctx: any): { method: string; args: ExpressionNode[] } {
    const method = ctx.Identifier[0].image;
    const args = ctx.argList ? (this.visit(ctx.argList) as ExpressionNode[]) : [];
    return { method, args };
  }

  argList(ctx: any): ExpressionNode[] {
    return (ctx.logicalOrExpr as any[]).map(node => this.visit(node));
  }

  logicalOrExpr(ctx: any): ExpressionNode {
    let left = this.visit(ctx.logicalAndExpr[0]);
    if (ctx.Or && ctx.Or.length > 0) {
      ctx.logicalAndExpr.slice(1).forEach((rhs: any) => {
        left = { type: 'LogicalExpression', operator: '||', left, right: this.visit(rhs) };
      });
    }
    return left;
  }

  logicalAndExpr(ctx: any): ExpressionNode {
    let left = this.visit(ctx.relationalExpr[0]);
    if (ctx.And && ctx.And.length > 0) {
      ctx.relationalExpr.slice(1).forEach((rhs: any) => {
        left = { type: 'LogicalExpression', operator: '&&', left, right: this.visit(rhs) };
      });
    }
    return left;
  }

  relationalExpr(ctx: any): ExpressionNode {
    const left = this.visit(ctx.primary[0]);

    if (ctx.relationalOperator && ctx.primary.length > 1) {
      const operator = this.visit(ctx.relationalOperator);
      const right = this.visit(ctx.primary[1]);

      if (right.type === 'Literal') {
        this.params.push(right.value);
      }

      return { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  relationalOperator(ctx: any): string {
    if (ctx.Equals) return ctx.Equals[0].image;
    if (ctx.NotEquals) return ctx.NotEquals[0].image;
    if (ctx.Greater) return ctx.Greater[0].image;
    if (ctx.Less) return ctx.Less[0].image;
    return '';
  }

  primary(ctx: any): ExpressionNode {
    let node: ExpressionNode;

    if (ctx.Identifier) {
      const name = (ctx.Identifier as any[]).map(t => t.image).join('.');
      node = { type: 'Identifier', name };
    } else if (ctx.StringLiteral) {
      node = { type: 'Literal', value: ctx.StringLiteral[0].image.slice(1, -1) };
    } else if (ctx.NumberLiteral) {
      node = { type: 'Literal', value: parseFloat(ctx.NumberLiteral[0].image) };
    } else if (ctx.logicalOrExpr) {
      node = this.visit(ctx.logicalOrExpr);
    } else {
      throw new Error('Unsupported primary expression');
    }

    if (ctx.Minus) {
      if (node.type === 'Literal' && typeof node.value === 'number') {
        node = { type: 'Literal', value: -node.value };
      } else {
        node = { type: 'UnaryExpression', operator: '-', argument: node };
      }
    }

    return node;
  }
}

export const visitor = new FluxQLVisitor();
