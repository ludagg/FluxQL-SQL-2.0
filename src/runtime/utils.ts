export function inferJoinOn(from: string, to: string): string {
  return `${from}.id = ${to}.${from}_id`;
}
