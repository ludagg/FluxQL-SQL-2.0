# Custom Extensions

Register a custom chainable operation with `extend(name, fn)`. The callback
receives the query's `ast` and the array of arguments passed at call time, and
mutates the AST in place.

```typescript
import { fluxql, extend } from 'fluxql';

// Moving average over the last `window` rows.
extend('movingAverage', (ast, [window, field = 'amount']) => {
  (ast.aggregates ??= []).push({
    type: 'Aggregate',
    func: 'avg',
    field,
    alias: 'moving_avg',
    over: `ORDER BY id ROWS ${window} PRECEDING`,
  });
});

const q = fluxql('sales').movingAverage(7, 'amount');
console.log(q.toSQL('postgres').sql);
// SELECT AVG("amount") OVER (ORDER BY id ROWS 7 PRECEDING) AS "moving_avg" FROM "sales";
```

## Notes
- Always initialize array fields defensively (`ast.aggregates ??= []`), since a
  fresh query only contains `from`, `filter` and `params`.
- An aggregate with an `over` string is rendered as `FUNC(field) OVER (<over>)`.
- The returned query is still chainable, so extensions compose with the
  built-in methods (`.filter()`, `.limit()`, ...).

## AI text-to-query (roadmap)
A natural-language front end can target the same AST: have an LLM emit a
`QueryNode` (or a FluxQL string parsed via `parse()`), then compile it with
`toSQL()`. This is not bundled today.
