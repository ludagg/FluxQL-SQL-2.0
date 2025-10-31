import { fluxql } from '../dist/index.js'; // Use dist after build

async function main() {
  const query = fluxql('users')
    .filter('country === "FR" && age > 18')
    .join('orders')
    .groupBy('name')
    .sum('orders.total')
    .orderBy('-sum')
    .limit(10);

  const { sql, params } = query.toSQL('postgres');
  console.log('SQL:', sql);
  console.log('Params:', params);

  // Mock execute
  // const results = await query.execute({ connection: pgPool });
}

main().catch(console.error);