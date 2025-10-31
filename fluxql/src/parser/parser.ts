import { createToken, Lexer } from 'chevrotain';

export const WhiteSpace = createToken({ name: 'WhiteSpace', pattern: /\s+/, group: Lexer.SKIPPED });
export const Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z_][a-zA-Z0-9_]*/ });
export const StringLiteral = createToken({ name: 'StringLiteral', pattern: /"([^"\\]|\\.)*"/ });
export const NumberLiteral = createToken({ name: 'NumberLiteral', pattern: /\d+(\.\d+)?/ });

export const Dot = createToken({ name: 'Dot', pattern: /\./ });
export const LParen = createToken({ name: 'LParen', pattern: /\(/ });
export const RParen = createToken({ name: 'RParen', pattern: /\)/ });
export const Equals = createToken({ name: 'Equals', pattern: /===?/ });
export const Greater = createToken({ name: 'Greater', pattern: />=?/ });
export const Less = createToken({ name: 'Less', pattern: /<=?/ });
export const And = createToken({ name: 'And', pattern: /&&/ });
export const Or = createToken({ name: 'Or', pattern: /\|\|/ });
export const Not = createToken({ name: 'Not', pattern: /!/ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });