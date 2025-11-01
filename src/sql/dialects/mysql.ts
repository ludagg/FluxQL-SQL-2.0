import { Dialect } from '../../parser/ast.js';

export const mysqlDialect: Dialect = {
  quote: (id: string) => `\`${id}\``,
  param: (i: number) => `?`,
  aggregate: (func: string, field: string) => `${func.toUpperCase()}(${field})`
};
