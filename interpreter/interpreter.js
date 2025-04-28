import { Types } from './types.js';
import { cleanLiteral } from './utils.js';
import readlineSync from 'readline-sync';

export function run(ast, env) {
  const output = [];
  let conditionSatisfied = false; // Track if a condition has been satisfied

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
        if (!conditionSatisfied) {
          conditionSatisfied = handleConditional(node, env); // Execute only if no prior condition was satisfied
        }
        break;
      case 'LOOP':
        handleLoop(node, env);
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

  variables.forEach(name => {
      const current = env.variables.get(name);
      if (!current) throw new Error(`Variable '${name}' not declared.`);

      const inputLine = readlineSync.question(`Enter value for ${name}: `);
      let val = inputLine.trim();

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


function handleConditional(node, env) {
  const line = node.line;

  // Validate the line
  if (!line || typeof line !== 'string') {
    throw new Error(`Invalid or missing line in CONDITIONAL node: ${JSON.stringify(node)}`);
  }

  // Remove "KUNG" from the start
  const conditionPart = line.slice(4).trim(); // Remove "KUNG", left with "edad > 18 PUNDOK{"

  // Ensure it ends with "PUNDOK{"
  if (!conditionPart.endsWith('PUNDOK{')) {
    throw new Error(`Invalid KUNG syntax: ${line}`);
  }

  // Remove "PUNDOK{" from the end
  const conditionExpression = conditionPart.slice(0, -7).trim(); // Remove "PUNDOK{" (7 characters)

  // Evaluate the condition
  const [left, operator, right] = conditionExpression.split(/\s+/);

  const leftValue = env.get(left) ?? Number(left);
  const rightValue = env.get(right) ?? Number(right);

  let result = false;
  switch (operator) {
    case '==':
      result = leftValue == rightValue;
      break;
    case '!=':
      result = leftValue != rightValue;
      break;
    case '>':
      result = leftValue > rightValue;
      break;
    case '<':
      result = leftValue < rightValue;
      break;
    case '>=':
      result = leftValue >= rightValue;
      break;
    case '<=':
      result = leftValue <= rightValue;
      break;
    default:
      throw new Error(`Unsupported operator in KUNG: ${operator}`);
  }

  // If the condition is true, execute the block and return true
  if (result) {
    if (!node.block || !Array.isArray(node.block)) {
      throw new Error(`Missing or invalid block in CONDITIONAL node: ${JSON.stringify(node)}`);
    }

    node.block.forEach(statement => {
      switch (statement.type) {
        case 'PRINT':
          console.log(...handlePrint(statement.expression, env));
          break;
        case 'ASSIGNMENT':
          handleAssignment(statement.line, env);
          break;
        default:
          throw new Error(`Unsupported statement type in conditional block: ${statement.type}`);
      }
    });
    return true;
  }

  return false;
}



function handleLoop(node, env) {
  const line = node.line;  // The line associated with the loop (should be a string)

  if (typeof line !== 'string') {
      throw new Error(`Expected a string for loop condition, but got: ${typeof line}`);
  }

  // Ensure line is in the expected format
  const conditionExpr = line.slice(7).trim(); // Remove "SAMTANG " from the start
  const conditionTokens = tokenizeExpression(conditionExpr); // Tokenize the condition expression

  let conditionSatisfied = false;

  // First, evaluate the condition
  const evaluateCondition = () => {
      const evaluatedCondition = conditionTokens.map(token => {
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
          return eval(evaluatedCondition);  // Evaluate the condition
      } catch (e) {
          throw new Error(`Invalid expression in loop condition: "${evaluatedCondition}"`);
      }
  };

  // Now evaluate the condition before entering the loop
  conditionSatisfied = evaluateCondition();

  while (conditionSatisfied) {
      node.block.forEach(statement => {
          switch (statement.type) {
              case 'PRINT':
                  console.log(...handlePrint(statement.expression, env));
                  break;
              case 'ASSIGNMENT':
                  handleAssignment(statement.line, env);
                  break;
              default:
                  throw new Error(`Unsupported statement type in loop block: ${statement.type}`);
          }
      });

      // Recheck the condition at the end of the loop to decide if we should continue
      conditionSatisfied = evaluateCondition();
  }
}






