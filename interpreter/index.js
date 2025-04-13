import { tokenize } from './lexer.js';
import { parse } from './parser.js';
import { run } from './interpreter.js';
import { Environment } from './environment.js';
import fs from 'fs';

const code = fs.readFileSync('./examples/sample.bpp', 'utf-8');
const tokens = tokenize(code);
const ast = parse(tokens);
const env = new Environment();
const output = run(ast, env);

console.log(output.join('\n'));
