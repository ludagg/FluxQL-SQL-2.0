export type AstNode = {
  type: string;
};

export type ExpressionNode =
  | Identifier
  | Literal
  | UnaryExpression
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

export type UnaryExpression = AstNode & {
  type: 'UnaryExpression';
  operator: string;
  argument: ExpressionNode;
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
  /** Optional window frame; when set, renders `FUNC(field) OVER (<over>)`. */
  over?: string;
};

export type JoinNode = AstNode & {
  type: 'Join';
  table: string;
  /** Optional raw ON clause. When omitted it is inferred from table names. */
  on?: string;
};

export type OrderByNode = AstNode & {
  type: 'OrderBy';
  field: string;
  direction: 'ASC' | 'DESC';
};

export type QueryNode = AstNode & {
  type: 'Query';
  from: Identifier;
  select?: string[];
  filter?: ExpressionNode;
  joins?: JoinNode[];
  aggregates?: AggregateNode[];
  groupBy?: string[];
  orderBy?: OrderByNode[];
  limit?: number;
  params: any[];
};

export type Dialect = {
  quote: (id: string) => string;
  param: (i: number) => string;
  aggregate: (func: string, field: string) => string;
};
