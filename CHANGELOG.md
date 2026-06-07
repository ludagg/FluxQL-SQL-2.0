# Changelog

## Unreleased
- Builder: implement `join`, `groupBy`, `select`, `orderBy`, `limit` and the `sum`/`avg`/`min`/`max`/`count` aggregates so the documented fluent API works end to end.
- Generator: fix comparison operator mapping (`==`/`===` → `=`, `!=` → `<>`), quote qualified identifiers per segment (`users.name` → `"users"."name"`), and parameter-safe aggregate fields. Added JOIN and ORDER BY emission.
- Parser/DSL: support qualified identifiers, single-quoted strings, leading `-` for descending order, comma-separated arguments, and full method chains (previously only the first `.filter()` was honored).
- Runtime: `execute()` now reuses an existing pg Pool/Client and respects the SQLite file path; CLI `run` actually compiles and executes against the target database.
- Build: mark dependencies as external so native drivers (pg/mysql2/sqlite3) are not bundled into the ESM output.
- Tooling: modernize `tsconfig` module resolution; add builder/DSL test suites.

## 1.1.1 (2025-10-31)
- Rename from FlowQL to FluxQL (name conflict avoidance).
- Parser: Full support for nested expressions (&&, ||).
- Generator: Complete parameterization for all dialects.
- CLI: REPL with readline integration.

## 1.1.0 (2025-10-31)
- Parser improvements: Complex expressions.
- Security: Full param extraction.
- Tests: 85%+ coverage, DB mocks.

## 1.0.0 (Initial)
- Core framework release.
