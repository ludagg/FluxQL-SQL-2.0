#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { parse } from '../parser/index.js';
import { SQLGenerator } from '../sql/generator.js';
import { postgresDialect, mysqlDialect, sqliteDialect } from '../sql/dialects/index.js';
import type { QueryNode } from '../parser/ast.js';

type DialectName = 'postgres' | 'mysql' | 'sqlite';

function dialectFor(name: DialectName) {
  return name === 'mysql' ? mysqlDialect : name === 'sqlite' ? sqliteDialect : postgresDialect;
}

function compile(ast: QueryNode, dialect: DialectName) {
  const gen = new SQLGenerator();
  gen.setDialect(dialectFor(dialect));
  return gen.generate(ast);
}

/** Infers the SQL dialect from a connection URI. */
function dialectFromUri(uri: string): DialectName {
  if (/^mysql:\/\//i.test(uri)) return 'mysql';
  if (/^(postgres|postgresql):\/\//i.test(uri)) return 'postgres';
  if (/^sqlite:/i.test(uri) || /\.(db|sqlite|sqlite3)$/i.test(uri)) return 'sqlite';
  return 'postgres';
}

async function runQuery(sql: string, params: any[], uri: string): Promise<any[]> {
  const dialect = dialectFromUri(uri);

  if (dialect === 'mysql') {
    const mysql = await import('mysql2/promise');
    const conn = await mysql.createConnection(uri);
    try {
      const [rows] = await conn.execute(sql, params);
      return rows as any[];
    } finally {
      await conn.end();
    }
  }

  if (dialect === 'sqlite') {
    const sqlite3 = await import('sqlite3');
    const lib: any = (sqlite3 as any).default ?? sqlite3;
    const file = uri.replace(/^sqlite:(\/\/)?/i, '') || ':memory:';
    return new Promise((resolve, reject) => {
      const db = new lib.Database(file);
      db.all(sql, params, (err: Error | null, rows: any[]) => {
        db.close();
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  const { Client } = await import('pg');
  const client = new Client({ connectionString: uri });
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    await client.end();
  }
}

const program = new Command();
program.name('fluxql').description('FluxQL CLI').version('1.1.1');

program
  .command('compile <file>')
  .description('Compile a .fluxql file to SQL')
  .option('-d, --dialect <type>', 'Target SQL dialect (postgres|mysql|sqlite)', 'postgres')
  .option('--explain', 'Print the parsed AST')
  .action((file, opts) => {
    const content = fs.readFileSync(file, 'utf8').trim();
    const ast = parse(content);
    const { sql, params } = compile(ast, opts.dialect as DialectName);
    if (opts.explain) console.log('AST:', JSON.stringify(ast, null, 2));
    console.log(sql);
    if (params.length) console.log('Params:', JSON.stringify(params));
  });

program
  .command('run <file>')
  .description('Compile and execute a .fluxql file against a database')
  .requiredOption('--db <uri>', 'DB connection string')
  .action(async (file, opts) => {
    const content = fs.readFileSync(file, 'utf8').trim();
    const ast = parse(content);
    const { sql, params } = compile(ast, dialectFromUri(opts.db));
    try {
      const rows = await runQuery(sql, params, opts.db);
      console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
      console.error('Execution error:', (e as Error).message);
      process.exitCode = 1;
    }
  });

program
  .command('repl')
  .description('Interactive REPL')
  .option('-d, --dialect <type>', 'Target SQL dialect (postgres|mysql|sqlite)', 'postgres')
  .action((opts) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'fluxql> '
    });
    rl.prompt();
    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (trimmed === '.exit') {
        rl.close();
        return;
      }
      if (trimmed) {
        try {
          const ast = parse(trimmed);
          const { sql, params } = compile(ast, opts.dialect as DialectName);
          console.log(sql);
          if (params.length) console.log('Params:', JSON.stringify(params));
        } catch (e) {
          console.error('Error:', (e as Error).message);
        }
      }
      rl.prompt();
    });
    rl.on('close', () => process.exit(0));
  });

program.parse();
