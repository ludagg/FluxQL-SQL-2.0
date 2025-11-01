# Custom Extensions

Define AST mutators:
```typescript
extend('movingAverage', (ast, [window]) => {
  ast.aggregates.push({ type: 'Aggregate', func: 'AVG', field: 'amount', window });
});
```

Integrate AI: Use LLM to parse text → FluxQL AST.
