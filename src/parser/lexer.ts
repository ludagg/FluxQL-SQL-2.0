import { Lexer } from 'chevrotain';
import * as tokens from './tokens.js';

// Order matters: longer / more specific patterns must come before their prefixes
// (e.g. NotEquals before Less so that "<>" is not split into "<" and ">").
export const allTokens = [
  tokens.WhiteSpace,
  tokens.StringLiteral,
  tokens.NumberLiteral,
  tokens.Dot,
  tokens.LParen,
  tokens.RParen,
  tokens.Equals,
  tokens.NotEquals,
  tokens.Greater,
  tokens.Less,
  tokens.And,
  tokens.Or,
  tokens.Minus,
  tokens.Comma,
  tokens.Identifier
];

export const FluxQLLexer = new Lexer(allTokens);
