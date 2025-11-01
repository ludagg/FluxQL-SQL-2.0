# API Reference

## Core
- `fluxql(table: string): FluxQLQuery`
- `FluxQLQuery.filter(expr: string): this`
- `FluxQLQuery.toSQL(dialect?: 'postgres'|'mysql'|'sqlite'): {sql: string, params: any[]}`
- `FluxQLQuery.execute(options: {connection: any, dialect?: string}): Promise<any[]>`

## Utils
- `extend(name: string, fn: ExtensionFn): void`
