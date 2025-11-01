import { CstNode, IToken } from 'chevrotain';
import { parser } from './parser';
import { ExpressionNode, QueryNode } from './ast';

const BaseFluxQLVisitor = parser.getBaseCstVisitorConstructor();

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
    let filter: ExpressionNode | undefined;
    let select: string[] | undefined;

    if (ctx.methodCall) {
      const method = this.visit(ctx.methodCall);
      if (method && method.type === 'FilterOperation') {
        filter = method.expression;
      }
    }

    return {
      type: 'Query',
      from: { type: 'Identifier', name: table },
      filter,
      select,
      params: this.params,
    };
  }

  // Visitor for the new expression rule
  expression(ctx: any): ExpressionNode {
    return this.visit(ctx.logicalOrExpr);
  }

  methodCall(ctx: any) {
    const methodName = ctx.Identifier[0].image;

    if (methodName === 'filter') {
      const expression = this.visit(ctx.logicalOrExpr);
      return { type: 'FilterOperation', expression };
    }

    return null;
  }

  logicalOrExpr(ctx: any): ExpressionNode {
    let left = this.visit(ctx.logicalAndExpr[0]);

    if (ctx.Or && ctx.Or.length > 0) {
      ctx.logicalAndExpr.slice(1).forEach((rhs: any, i: number) => {
        const right = this.visit(rhs);
        left = {
          type: 'LogicalExpression',
          operator: '||',
          left,
          right,
        };
      });
    }

    return left;
  }

  logicalAndExpr(ctx: any): ExpressionNode {
    let left = this.visit(ctx.relationalExpr[0]);

    if (ctx.And && ctx.And.length > 0) {
      ctx.relationalExpr.slice(1).forEach((rhs: any, i: number) => {
        const right = this.visit(rhs);
        left = {
          type: 'LogicalExpression',
          operator: '&&',
          left,
          right,
        };
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

      return {
        type: 'BinaryExpression',
        operator,
        left,
        right,
      };
    }

    return left;
  }

  relationalOperator(ctx: any): string {
    if (ctx.Equals) return '==';
    if (ctx.Greater) return '>';
    if (ctx.Less) return '<';
    if (ctx.Not) return '!=';
    return '';
  }

  primary(ctx: any): ExpressionNode {
    if (ctx.Identifier) {
      return { type: 'Identifier', name: ctx.Identifier[0].image };
    }
    if (ctx.StringLiteral) {
      return {
        type: 'Literal',
        value: ctx.StringLiteral[0].image.slice(1, -1),
      };
    }
    if (ctx.NumberLiteral) {
      return { type: 'Literal', value: parseFloat(ctx.NumberLiteral[0].image) };
    }
    if (ctx.LParen) {
      return this.visit(ctx.logicalOrExpr);
    }
    throw new Error('Unsupported primary expression');
  }
}

export const visitor = new FluxQLVisitor();
