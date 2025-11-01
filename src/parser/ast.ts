export type AstNode = {
  type: string;
};

export type ExpressionNode =
  | Identifier
  | Literal
  | BinaryExpression
  | LogicalExpression;

export type Identifier = AstNode & {
  type: 'Identifier';
  name: string;
};

export type Literal = AstNode & {
  type: 'Literal';
  value: string | number;
};

export type BinaryExpression = AstNode & {
  type: 'BinaryExpression';
  operator: string;
  left: ExpressionNode;
  right: ExpressionNode;
};

export type LogicalExpression = AstNode & {
  type: 'LogicalExpression';
  operator: '&&' | '||';
  left: ExpressionNode;
  right: ExpressionNode;
};

export type AggregateNode = AstNode & {
  type: 'Aggregate';
  func: string;
  field: string;
  alias?: string;
};

export type QueryNode = AstNode & {
  type: 'Query';
  from: Identifier;
  select?: string[];
  filter?: ExpressionNode;
  aggregates?: AggregateNode[];
  groupBy?: string[];
  limit?: number;
  params: any[];
};

export type Dialect = {
  quote: (id: string) => string;
  param: (i: number) => string;
  aggregate: (func: string, field: string) => string;
};
