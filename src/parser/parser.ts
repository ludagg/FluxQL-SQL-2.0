import { CstNode, ParserMethod } from 'chevrotain';
import { CstParser } from 'chevrotain';
import { allTokens } from './lexer.js';
import * as tokens from './tokens.js';

class FluxQLParser extends CstParser {
  public query!: ParserMethod<[], CstNode>;
  public expression!: ParserMethod<[], CstNode>;
  public methodCall!: ParserMethod<[], CstNode>;
  public argList!: ParserMethod<[], CstNode>;
  public logicalOrExpr!: ParserMethod<[], CstNode>;
  public logicalAndExpr!: ParserMethod<[], CstNode>;
  public relationalExpr!: ParserMethod<[], CstNode>;
  public relationalOperator!: ParserMethod<[], CstNode>;
  public primary!: ParserMethod<[], CstNode>;

  constructor() {
    super(allTokens);

    const $ = this;

    this.query = $.RULE('query', () => {
      $.CONSUME(tokens.Identifier);
      $.MANY(() => $.SUBRULE($.methodCall));
    });

    // Rule for parsing a standalone expression (used by parseExpression).
    this.expression = $.RULE('expression', () => {
      $.SUBRULE($.logicalOrExpr);
    });

    this.methodCall = $.RULE('methodCall', () => {
      $.CONSUME(tokens.Dot);
      $.CONSUME(tokens.Identifier);
      $.CONSUME(tokens.LParen);
      $.OPTION(() => $.SUBRULE($.argList));
      $.CONSUME(tokens.RParen);
    });

    this.argList = $.RULE('argList', () => {
      $.SUBRULE($.logicalOrExpr);
      $.MANY(() => {
        $.CONSUME(tokens.Comma);
        $.SUBRULE2($.logicalOrExpr);
      });
    });

    this.logicalOrExpr = $.RULE('logicalOrExpr', () => {
      $.SUBRULE($.logicalAndExpr);
      $.MANY(() => {
        $.CONSUME(tokens.Or);
        $.SUBRULE2($.logicalAndExpr);
      });
    });

    this.logicalAndExpr = $.RULE('logicalAndExpr', () => {
      $.SUBRULE($.relationalExpr);
      $.MANY(() => {
        $.CONSUME(tokens.And);
        $.SUBRULE2($.relationalExpr);
      });
    });

    this.relationalExpr = $.RULE('relationalExpr', () => {
      $.SUBRULE($.primary);
      $.OPTION(() => {
        $.SUBRULE($.relationalOperator);
        $.SUBRULE2($.primary);
      });
    });

    this.relationalOperator = $.RULE('relationalOperator', () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens.Equals) },
        { ALT: () => $.CONSUME(tokens.NotEquals) },
        { ALT: () => $.CONSUME(tokens.Greater) },
        { ALT: () => $.CONSUME(tokens.Less) }
      ]);
    });

    this.primary = $.RULE('primary', () => {
      $.OPTION(() => $.CONSUME(tokens.Minus));
      $.OR([
        {
          ALT: () => {
            $.CONSUME(tokens.Identifier);
            $.MANY(() => {
              $.CONSUME(tokens.Dot);
              $.CONSUME2(tokens.Identifier);
            });
          }
        },
        { ALT: () => $.CONSUME(tokens.StringLiteral) },
        { ALT: () => $.CONSUME(tokens.NumberLiteral) },
        {
          ALT: () => {
            $.CONSUME(tokens.LParen);
            $.SUBRULE($.logicalOrExpr);
            $.CONSUME(tokens.RParen);
          }
        }
      ]);
    });

    this.performSelfAnalysis();
  }
}

export const parser = new FluxQLParser();
