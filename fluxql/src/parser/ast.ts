export interface AstNode { type: string; }

export interface QueryNode extends AstNode {
  type: 'Query';
  from: TableNode;
  filter?: ExpressionNode;
  joins: JoinNode[];
  groupBy?: string[];
  aggregates: AggregateNode[];
  orderBy: OrderNode[];
  limit?: number;
  select?: SelectNode;
  params: any[];
}

export interface TableNode extends AstNode { type: 'Table'; name: string; alias?: string; }

export interface JoinNode extends AstNode { type: 'Join'; table: TableNode; on?: ExpressionNode; }

export interface ExpressionNode extends AstNode {
  type: 'Expression';
  left: string | ExpressionNode;
  operator: string;
  right?: string | ExpressionNode;
}

export interface AggregateNode extends AstNode { type: 'Aggregate'; func: string; field: string; alias?: string; }

export interface OrderNode extends AstNode { type: 'Order'; field: string; direction: 'ASC' | 'DESC'; }

export interface SelectNode extends AstNode { type: 'Select'; fields: string[]; }

export type Dialect = {
  quote: (id: string) => string;
  param: (i: number) => string;
  aggregate: (func: string, field: string) => string;
};