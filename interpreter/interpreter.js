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
  // Check if the line is a valid string and contains an assignment operator '='
  if (typeof line !== 'string') {
    throw new Error(`Expected a string for assignment, but got: ${typeof line}`);
  }

  if (!line.includes('=')) {
    throw new Error(`Invalid assignment syntax, '=' operator missing in line: ${line}`);
  }

  const parts = line.split('=').map(s => s.trim());

  // Ensure the assignment is in the correct format (at least a variable and a value)
  if (parts.length < 2) {
    throw new Error(`Invalid assignment, expected "variable = value" format but got: ${line}`);
  }

  const targetVars = parts.slice(0, -1); // All but the last part are variable names
  const expression = parts.at(-1); // Last part is the expression to assign

  const tokens = tokenizeExpression(expression);
  let value;

  // Handle string literals and evaluate the expression
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
      value = eval(evaluatedExpression); // Evaluate the expression
    } catch (e) {
      throw new Error(`Invalid expression: "${expression}" → "${evaluatedExpression}"`);
    }
  }

  // Assign the evaluated value to the target variables
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
  const line = node.line.trim(); // The line associated with the loop

  if (typeof line !== 'string') {
    throw new Error(`Expected a string for loop condition, but got: ${typeof line}`);
  }

  if (line.startsWith('ALANG SA')) {
    const loopExpr = line.slice(10, -1).trim(); // Remove "ALANG SA (" and ")" from start and end
    const [initialization, condition, update] = loopExpr.split(',').map(s => s.trim());

    // Initialize variables
    handleAssignment(initialization, env);

    const evaluateCondition = () => {
      const conditionTokens = tokenizeExpression(condition);
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
        return eval(evaluatedCondition);
      } catch (e) {
        throw new Error(`Invalid expression in loop condition: "${evaluatedCondition}"`);
      }
    };

    let conditionSatisfied = evaluateCondition();

    while (conditionSatisfied) {
      // Execute statements inside the loop block
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

      // Handle the update manually
      if (update.endsWith('++')) {
        const varName = update.slice(0, -2).trim();
        const currentVal = env.get(varName);
        env.assign(varName, currentVal + 1);
      } else if (update.endsWith('--')) {
        const varName = update.slice(0, -2).trim();
        const currentVal = env.get(varName);
        env.assign(varName, currentVal - 1);
      } else {
        // Normal assignment
        handleAssignment(update, env);
      }

      // Reevaluate condition
      conditionSatisfied = evaluateCondition();
    }
  } else {
    throw new Error(`Unsupported loop type: ${line}`);
  }
}









