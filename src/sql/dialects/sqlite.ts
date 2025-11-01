import { Dialect } from '../../parser/ast.js';

export const sqliteDialect: Dialect = {
  quote: (id: string) => `"${id}"`,
  param: (i: number) => `$${i}`,
  aggregate: (func: string, field: string) => `${func.toUpperCase()}(${field})`
};
