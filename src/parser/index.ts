import { FluxQLLexer } from './lexer.js';
import { parser } from './parser.js';
import { visitor } from './visitor.js';
import { QueryNode, ExpressionNode } from './ast.js';

/**
 * Parses a full FluxQL query string into a QueryNode AST.
 */
export function parse(query: string): QueryNode {
  const lexResult = FluxQLLexer.tokenize(query);
  parser.input = lexResult.tokens;
  const cst = parser.query();

  if (parser.errors.length > 0) {
    throw new Error(`Parsing errors detected: ${parser.errors[0].message}`);
  }

  const ast = visitor.visit(cst) as QueryNode;
  return ast;
}

/**
 * Parses a FluxQL expression string into an ExpressionNode AST.
 */
export function parseExpression(expression: string): { expression: ExpressionNode, params: any[] } {
  const lexResult = FluxQLLexer.tokenize(expression);
  parser.input = lexResult.tokens;
  const cst = parser.expression();

  if (parser.errors.length > 0) {
    throw new Error(`Parsing errors detected: ${parser.errors[0].message}`);
  }

  // Reset params before visiting, as visitor is stateful
  visitor.params = [];
  const expressionAst = visitor.visit(cst) as ExpressionNode;

  return { expression: expressionAst, params: visitor.params };
}
