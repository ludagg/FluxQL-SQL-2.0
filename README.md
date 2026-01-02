# FluxQL 🚀 – The Fluent SQL of the Future

[![Tests](https://github.com/votreusername/fluxql/actions/workflows/ci.yml/badge.svg)](https://github.com/votreusername/fluxql/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**FluxQL** is a modern, declarative query language that reimagines SQL as a fluent, chainable API. Write queries like code flows, not rigid strings. Compiles to secure, portable SQL for PostgreSQL, MySQL, SQLite.

> **Philosophy**: As simple as JS, powerful as SQL, extensible as Python, elegant as OmniLang. Think data as a *flux*, not a wall of text.

## ✨ Features
- **Fluent Syntax**: Chain `.filter()`, `.join()`, `.groupBy()` like JS.
- **Auto-Compile**: Generates optimized SQL with dialects.
- **Secure**: Built-in parameterization – no SQL injection.
- **Extensible**: Add custom ops like `.trend()` or AI text-to-query.
- **Integrations**: JS/TS native; CLI, REPL; easy in React/Next.js.
- **Prod-Ready**: TS, tests (85%+ cov), CI/CD.

## 🚀 Quick Start

### Basic Usage (JS/TS)
```javascript
import { fluxql } from 'fluxql';

const query = fluxql('users')
  .filter('country === "FR" && age > 18')
  .join('orders')
  .groupBy('name')
  .sum('orders.total')
  .orderBy('-sum')
  .limit(10);

console.log(query.toSQL('postgres'));
// SELECT users.name, SUM(orders.total) AS sum FROM "users" JOIN "orders" ON users.id = orders.user_id WHERE (users.country = $1 AND users.age > $2) GROUP BY users.name ORDER BY sum DESC LIMIT $3;

const results = await query.execute({ connection: pgPool, dialect: 'postgres' });
```

### CLI
```bash
# Compile to SQL
npx fluxql compile query.fluxql --dialect postgres --explain

# Run against DB
npx fluxql run query.fluxql --db postgres://user:pass@host/db

# REPL
npx fluxql repl
```

## 📖 Examples
See [examples/](examples/) for full scripts.

### Simple Filter
```fluxql
products.filter(price > 100 && stock > 0).select('name, price')
```
→ `SELECT name, price FROM products WHERE price > $1 AND stock > $2;`

### Advanced Aggregation
```fluxql
sales.groupBy('region').sum('amount').orderBy('-sum')
```
→ `SELECT region, SUM(amount) AS sum FROM sales GROUP BY region ORDER BY sum DESC;`

## 🛠️ API Reference
See [docs/api.md](docs/api.md) for full docs.

- `fluxql(table: string)`: Start query.
- `.filter(expr: string)`: WHERE (supports `==`, `>`, `&&`, etc.).
- `.join(table: string)`: INNER JOIN (auto-ON infer).
- `.toSQL(dialect?: string)`: Generate SQL.
- `.execute({ connection, dialect })`: Run & return rows.

## 🔧 Extensions
```javascript
import { extend } from 'fluxql';

extend('trend', (ast, [period, field]) => {
  // Add window function
  ast.aggregates.push({ type: 'Window', func: 'AVG', field, over: `ROWS ${period} PRECEDING` });
});

// Usage
fluxql('sales').trend(7, 'amount');
```
See [docs/extensions.md](docs/extensions.md).

## 🧪 Testing & Build
```bash
npm test      # Run tests
npm run build # Bundle
npm run docs  # Generate API docs
```

Coverage: 85%+ | Works with Node 18+.

## 📚 Full Documentation
- [Getting Started](docs/tutorials.md)
- [Building Queries](docs/tutorials.md#building-queries)
- [API](docs/api.md)
- [Extensions](docs/extensions.md)

## 🤝 Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md). PRs welcome!

## 📄 License
MIT – See [LICENSE](LICENSE).

## 🙌 Credits
Built with ❤️ by Ludovic A. @ LuvviX . Inspired by Prisma, Drizzle, and LINQ.

[Star on GitHub](https://github.com/ludagg/FluxQL-SQL-2.0) | [Issues](https://github.com/ludagg/FluxQL-SQL-2.0/issues)
