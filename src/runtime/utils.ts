/** Naive singularization: drops a trailing "s" ("users" -> "user"). */
export function singularize(name: string): string {
  return name.endsWith('s') ? name.slice(0, -1) : name;
}

/**
 * Infers the join key columns between two tables following the common
 * `from.id = to.<singular(from)>_id` convention.
 */
export function inferJoinOn(from: string, to: string): { left: string; right: string } {
  return {
    left: `${from}.id`,
    right: `${to}.${singularize(from)}_id`
  };
}
