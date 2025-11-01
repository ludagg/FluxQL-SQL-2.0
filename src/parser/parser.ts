import { CstParser, EmbeddedActionsParser } from 'chevrotain';
import { allTokens, FluxQLLexer } from './lexer.js';
import * as tokens from './tokens.js';
import { QueryNode, ExpressionNode } from './ast.js';

class FluxQLParser extends CstParser {
  constructor() {
    super(allTokens);

    const $ = this;

    $.RULE('query', () => {
      $.CONSUME(tokens.Identifier);
      $.MANY(() => $.SUBRULE($.methodCall));
    });

    $.RULE('methodCall', () => {
      $.CONSUME(tokens.Dot);
      $.CONSUME(tokens.Identifier);
      $.CONSUME(tokens.LParen);
      $.OPTION(() => $.SUBRULE($.logicalOrExpr));
      $.CONSUME(tokens.RParen);
    });

    // Hiérarchie des expressions (de la plus basse à la plus haute priorité)
    $.RULE('logicalOrExpr', () => {
      $.SUBRULE($.logicalAndExpr);
      $.MANY(() => {
        $.CONSUME(tokens.Or);
        $.SUBRULE2($.logicalAndExpr);
      });
    });

    $.RULE('logicalAndExpr', () => {
      $.SUBRULE($.relationalExpr);
      $.MANY(() => {
        $.CONSUME(tokens.And);
        $.SUBRULE2($.relationalExpr);
      });
    });

    $.RULE('relationalExpr', () => {
      $.SUBRULE($.primary);
      $.OPTION(() => {
        $.SUBRULE($.relationalOperator);
        $.SUBRULE2($.primary);
      });
    });

    $.RULE('relationalOperator', () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens.Equals) },
        { ALT: () => $.CONSUME(tokens.Greater) },
        { ALT: () => $.CONSUME(tokens.Less) },
        { ALT: () => $.CONSUME(tokens.Not) } // Pour !
      ]);
    });

    $.RULE('primary', () => {
      $.OR([
        // Identifiant
        { ALT: () => $.CONSUME(tokens.Identifier) },
        // Littéral string
        { ALT: () => $.CONSUME(tokens.StringLiteral) },
        // Littéral nombre
        { ALT: () => $.CONSUME(tokens.NumberLiteral) },
        // Parenthèses pour groupement
        { ALT: () => {
          $.CONSUME(tokens.LParen);
          $.SUBRULE($.logicalOrExpr);
          $.CONSUME(tokens.RParen);
        } }
      ]);
    });

    this.performSelfAnalysis();
  }
}

export const parser = new FluxQLParser();
