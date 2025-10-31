export { fluxql } from './runtime/query.js';
export { extend } from './runtime/extensions.js';
export type { QueryNode } from './parser/ast.js';

// CLI entry if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import('./cli/index.js');
}