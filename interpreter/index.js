import { tokenize } from './lexer.js';
import { parse } from './parser.js';
import { run } from './interpreter.js';
import { Environment } from './environment.js';
import fs from 'fs';

async function main() {
  try {
    const code = fs.readFileSync('./examples/sample.bpp', 'utf-8');
    const tokens = tokenize(code);

    if (tokens.length < 2) {
      throw new Error('Program must have at least SUGOD and KATAPUSAN.');
    }

    const firstLine = tokens[0].value;
    const lastLine = tokens[tokens.length - 1].value;

    if (firstLine !== 'SUGOD') {
      throw new Error(`Program must start with 'SUGOD'. Found: '${firstLine}'`);
    }

    if (lastLine !== 'KATAPUSAN') {
      throw new Error(`Program must end with 'KATAPUSAN'. Found: '${lastLine}'`);
    }

    const bodyTokens = tokens.slice(1, -1); 
    const ast = parse(bodyTokens);
    const env = new Environment();
    const output = run(ast, env);

    console.log(output.join('\n'));
    console.log('✅ Program executed successfully.');
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
  }
}

main();
