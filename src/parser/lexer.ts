import { Lexer } from 'chevrotain';
import * as tokens from './tokens.js';

export const allTokens = [
  tokens.WhiteSpace,
  tokens.Identifier,
  tokens.StringLiteral,
  tokens.NumberLiteral,
  tokens.Dot,
  tokens.LParen,
  tokens.RParen,
  tokens.Equals,
  tokens.Greater,
  tokens.Less,
  tokens.And,
  tokens.Or,
  tokens.Not,
  tokens.Comma
];

export const FluxQLLexer = new Lexer(allTokens);
