# API Reference

## Core
- `fluxql(table: string): FluxQLQuery` — start a query.

### Query building (all chainable, return `this`)
- `.filter(expr: string)` — WHERE clause. Supports `==`/`===`, `!=`, `>`, `>=`, `<`, `<=`, `&&`, `||` and parentheses. Calling it multiple times AND-combines the conditions. Literals are parameterized.
- `.select(fields: string | string[])` — projection. A comma-separated string is split automatically (`'name, price'`).
- `.join(table: string, on?: string)` — JOIN. When `on` is omitted it is inferred as `from.id = to.<singular(from)>_id`.
- `.groupBy(fields: string | string[])` — GROUP BY.
- `.sum(field, alias?)`, `.avg(field, alias?)`, `.min(field, alias?)`, `.max(field, alias?)`, `.count(field?, alias?)` — aggregates. Alias defaults to the function name. `count()` defaults to `COUNT(*)`.
- `.aggregate(func: string, field?: string, alias?: string)` — generic aggregate helper.
- `.orderBy(spec: string | string[])` — ORDER BY. Prefix a field with `-` for descending (`'-sum'`).
- `.limit(n: number)` — LIMIT (parameterized).

### Output & execution
- `.toSQL(dialect?: 'postgres' | 'mysql' | 'sqlite'): { sql: string; params: any[] }` — compile to SQL. Defaults to `postgres`.
- `.execute(options: { connection: any; dialect?: 'postgres' | 'mysql' | 'sqlite' }): Promise<any[]>` — compile and run.
  - **postgres**: pass a `pg` `Pool`/`Client` (reused as-is) or a client config object.
  - **mysql**: pass a `mysql2` connection config or URI.
  - **sqlite**: pass a database file path string (defaults to `:memory:`).

## Identifiers & quoting
Qualified identifiers are quoted per segment: `users.name` → `"users"."name"` (PostgreSQL/SQLite) or `` `users`.`name` `` (MySQL). The `*` wildcard is never quoted.

## Utils
- `extend(name: string, fn: (ast, args) => void): void` — register a custom chainable operation. See [extensions.md](extensions.md).
