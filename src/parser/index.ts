import { FluxQLLexer } from './lexer';
import { parser } from './parser';
import { visitor } from './visitor';
import { QueryNode } from './ast';

/**
 * Parses a FluxQL query string into an Abstract Syntax Tree (AST).
 *
 * @param query The FluxQL query string to parse.
 * @returns The AST representation of the query.
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
