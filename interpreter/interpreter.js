import { Types } from './types.js';
import { cleanLiteral, isNumeric } from './utils.js';

export function run(ast, env) {
  const output = [];

  ast.forEach(node => {
    switch (node.type) {
      case 'DECLARATION':
        handleDeclaration(node.line, env);
        break;
      case 'ASSIGNMENT':
        handleAssignment(node.line, env);
        break;
      case 'PRINT':
        output.push(...handlePrint(node.expression, env));
        break;
      case 'CONDITIONAL':
        handleConditional(node.line, env);
        break;
      case 'LOOP':
        handleLoop(node.line, env);
        break;
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  });

  return output;
}

function handleDeclaration(line, env) {
  const [, type, ...rest] = line.split(/\s+/);
  const declarations = rest.join(' ').split(',');

  declarations.forEach(part => {
    const [name, val] = part.split('=').map(s => s.trim());
    let value = null;

    if (val !== undefined) {
      if (type === Types.NUMERO) value = parseInt(val);
      if (type === Types.LETRA) value = cleanLiteral(val);
      if (type === Types.TINUOD) value = val === '"OO"';
    }

    env.declare(name, type, value);
  });
}

function handleAssignment(line, env) {
  const parts = line.split('=').map(s => s.trim());
  const value = resolveValue(parts.at(-1), env);

  for (let i = parts.length - 2; i >= 0; i--) {
    env.assign(parts[i], value);
  }
}

function handlePrint(expr, env) {
  const parts = expr.split('&').map(p => p.trim());
  const lines = [''];
  let current = 0;

  parts.forEach(part => {
    if (part === '$') {
      current++;
      lines[current] = '';
    } else if (part === '[#]') {
      lines[current] += '#';
    } else if (part.startsWith('"') || part.startsWith("'")) {
      lines[current] += cleanLiteral(part);
    } else {
      const value = env.get(part);

      if (value === true) {
        lines[current] += 'OO';  
      } else if (value === false) {
        lines[current] += 'DILI';  
      } else {
        lines[current] += value;
      }
    }
  });

  return lines;
}

function resolveValue(val, env) {
  if (env.get(val) !== null) return env.get(val);
  if (isNumeric(val)) return parseInt(val);
  return cleanLiteral(val);
}

function handleConditional(line, env) {
  // CONDITIONALS IMPLEMENTATION ONGOING
}

function handleLoop(line, env) {
  // LOOP IMPLEMENTATION ONGOING
}
