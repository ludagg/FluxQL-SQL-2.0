# Tutorials

## Getting Started
1. Install: `npm i fluxql`
2. Import: `import { fluxql } from 'fluxql';`
3. Query: See README.

## Building Queries
- **Filters**: Use JS-like expr: `age > 18 && country === "FR"`
- **Joins**: Auto-infer: `.join('orders')` → `ON users.id = orders.user_id`
- **Aggs**: `.groupBy('field').sum('col')`

Example in React/Next.js: See examples in repo.