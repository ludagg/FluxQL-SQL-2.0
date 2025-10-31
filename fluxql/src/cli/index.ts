#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { parser } from '../parser/parser.js';
import { SQLGenerator } from '../sql/generator.js';
import { postgresDialect, mysqlDialect, sqliteDialect } from '../sql/dialects/index.js';

const program = new Command();
program.name('fluxql').description('FluxQL CLI').version('1.1.1');

program
  .command('compile <file>')
  .option('-d, --dialect <type>', 'postgres', 'postgres')
  .option('--explain', 'Show AST')
  .action((file, opts) => {
    const content = fs.readFileSync(file, 'utf8');
    const ast = parser.parse(content);
    const dialect = opts.dialect === 'mysql' ? mysqlDialect : opts.dialect === 'sqlite' ? sqliteDialect : postgresDialect;
    const gen = new SQLGenerator();
    gen.setDialect(dialect);
    const { sql, params } = gen.generate(ast);
    if (opts.explain) console.log('AST:', JSON.stringify(ast, null, 2));
    console.log(sql);
    if (params.length) console.log('Params:', JSON.stringify(params));
  });

program
  .command('run <file>')
  .requiredOption('--db <uri>', 'DB connection string')
  .action((file, opts) => {
    console.log(`Running ${file} on ${opts.db} (implement connection logic)`);
    // TODO: Parse, generate, connect & execute
  });

program
  .command('repl')
  .description('Interactive REPL')
  .action(() => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'fluxql> '
    });
    rl.prompt();
    rl.on('line', (line) => {
      if (line.trim() === '.exit') {
        rl.close();
        return;
      }
      try {
        const ast = parser.parse(line);
        const gen = new SQLGenerator();
        gen.setDialect(postgresDialect);
        const { sql } = gen.generate(ast);
        console.log(sql);
      } catch (e) {
        console.error('Error:', (e as Error).message);
      }
      rl.prompt();
    });
    rl.on('close', () => process.exit(0));
  });

program.parse();