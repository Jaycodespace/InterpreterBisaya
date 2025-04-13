import { Types } from './types.js';
import { cleanLiteral } from './utils.js';
import readlineSync from 'readline-sync';

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
      case 'INPUT':
        handleInput(node.line, env);
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
  const targetVars = parts.slice(0, -1);
  const expression = parts.at(-1);

  const tokens = tokenizeExpression(expression);
  let value;

  if (expression.startsWith("'") || expression.startsWith('"')) {
    value = cleanLiteral(expression);
  } else {
    const evaluatedExpression = tokens.map(token => {
      if (token === 'UG') return '&&';
      if (token === 'O') return '||';
      if (token === 'DILI') return '!';
      if (token === '<>') return '!=';
      if (token === '==') return '==';

      const val = env.get(token);
      if (val !== null && val !== undefined) return val;

      return token;
    }).join(' ');

    try {
      value = eval(evaluatedExpression);
    } catch (e) {
      throw new Error(`Invalid expression: "${expression}" → "${evaluatedExpression}"`);
    }
  }

  for (let i = targetVars.length - 1; i >= 0; i--) {
    env.assign(targetVars[i], value);
  }
}

function handlePrint(expr, env) {
  const parts = expr.split('&').map(p => p.trim());
  const lines = [''];
  let current = 0;

  const escapeMap = {
    '[#]': '#',
    '[[]': '[',
    '[]]': ']',
  };

  parts.forEach(part => {
    if (part === '$') {
      current++;
      lines[current] = '';
    } else if (escapeMap[part]) {
      lines[current] += escapeMap[part];
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

function handleInput(line, env) {
    const variables = line.slice(6).split(',').map(v => v.trim());
  
    const inputLine = readlineSync.question(`Enter values for ${variables.join(', ')} (separated by commas): `);
    const inputValues = inputLine.split(',').map(s => s.trim());
  
    if (variables.length !== inputValues.length) {
      throw new Error(`Expected ${variables.length} inputs, got ${inputValues.length}`);
    }
  
    variables.forEach((name, i) => {
      const current = env.variables.get(name);
      if (!current) throw new Error(`Variable '${name}' not declared.`);
  
      let val = inputValues[i];
      if (current.type === Types.NUMERO) val = parseInt(val);
      if (current.type === Types.TINUOD) val = val.toUpperCase() === 'OO';
      if (current.type === Types.LETRA) val = cleanLiteral(val);
  
      env.assign(name, val);
    });
  }
  
  
function tokenizeExpression(expr) {
  const regex = /[a-zA-Z_]\w*|==|<>|[><]=?|[()+\-*/%]|UG|O|DILI|\d+/g;
  return expr.match(regex) || [];
}


function handleConditional(line, env) {
    // CONDITIONAL LOGIC TO BE IMPLEMENTED
}

function handleLoop(line, env) {
    // LOOP LOGIC TO BE IMPLEMENTED
}
