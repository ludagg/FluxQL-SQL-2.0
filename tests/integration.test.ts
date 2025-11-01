import { describe, it, expect, vi } from 'vitest';
import { fluxql } from '../src/index.js';

const mockPg = {
  Client: class {
    connect = vi.fn();
    query = vi.fn().mockResolvedValue({ rows: [{ name: 'Alice', sum: 300 }] });
    end = vi.fn();
  }
};
vi.doMock('pg', () => mockPg);

describe('Integration', () => {
  it('builds and generates SQL', () => {
    const q = fluxql('users').filter('age > 18');
    const { sql, params } = q.toSQL('postgres');
    expect(sql).toContain('$1');
    expect(params).toEqual([18]);
  });

  it('executes mock query', async () => {
    const q = fluxql('users').filter('age > 18');
    const res = await q.execute({ connection: {}, dialect: 'postgres' });
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe('Alice');
  });
});
