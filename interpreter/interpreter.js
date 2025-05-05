  import { Types } from './types.js';
  import { cleanLiteral } from './utils.js';
  import readlineSync from 'readline-sync';
  import { tokenize } from './lexer.js';
  import { parse } from './parser.js';

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
          handleConditionals(node, env, output);
          break;
        case 'FOR_LOOP':
          handleLoop(node, env, output);
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

    const validIdentifier = /^[a-zA-Z_]\w*$/;

    declarations.forEach(part => {
      const [name, valRaw] = part.split('=').map(s => s.trim());

      if (!validIdentifier.test(name)) {
        throw new Error(`Invalid variable name: '${name}'`);
      }

      let value = null;

      if (valRaw !== undefined) {
        if (type === Types.NUMERO) {
          if (isNaN(parseInt(valRaw))) throw new Error(`Invalid NUMERO value: '${valRaw}'`);
          value = parseInt(valRaw);
        } else if (type === Types.FLOAT) {
          if (isNaN(parseFloat(valRaw))) throw new Error(`Invalid FLOAT value: '${valRaw}'`);
          value = parseFloat(valRaw);
        } else if (type === Types.LETRA) {
          if (!/^["'].*["']$/.test(valRaw)) throw new Error(`Invalid LETRA value: '${valRaw}'`);
          value = cleanLiteral(valRaw);
        } else if (type === Types.TINUOD) {
          if (valRaw !== '"OO"' && valRaw !== '"DILI"') throw new Error(`Invalid TINUOD value: '${valRaw}'`);
          value = valRaw === '"OO"';
        } else {
          throw new Error(`Unknown type: '${type}'`);
        }
      }

      // Declare variables
      env.declare(name, type, value);
    });
  }




  function handleAssignment(line, env) {
    if (!line.includes('=')) {
      throw new Error(`Missing '=' in assignment: ${line}`);
    }

    // 1) Split on every '=' and trim
    const parts = line.split('=').map(s => s.trim());
    // 2) The last element is the RHS expression
    const expression = parts.pop();
    // 3) Everything before are LHS parts (could be 'x', 'z', or 'a,b')
    const lhsParts = parts;

    // 4) Expand each part by commas to get all target variable names
    const targetVars = lhsParts
      .flatMap(p => p.split(',').map(v => v.trim()))
      .filter(Boolean);

    // 5) Evaluate the RHS once
    const tokens = tokenizeExpression(expression);
    const value = evaluateTokens(tokens, env);

    // 6) Assign in right-to-left order for chain semantics
    targetVars
      .reverse()
      .forEach(varName => {
        if (!env.variables.has(varName)) {
          throw new Error(`Variable '${varName}' not declared.`);
        }
        env.assign(varName, value);
      });
  }


//HANDLE PRINT
  

  function handleInput(line, env) {
    const variables = line.slice(6).split(',').map(v => v.trim());
  
    variables.forEach(name => {
      const current = env.variables.get(name);
      if (!current) throw new Error(`Variable '${name}' not declared.`);
  
      const inputLine = readlineSync.question(`Enter value for ${name}: `);
      const raw = inputLine.trim();
  
      let parsedVal;
      switch (current.type) {
        case Types.NUMERO:
          parsedVal = parseInt(raw, 10);
          if (isNaN(parsedVal)) {
            throw new Error(`Invalid NUMERO input for '${name}': ${raw}`);
          }
          break;
  
        case Types.FLOAT:
          parsedVal = parseFloat(raw);
          if (isNaN(parsedVal)) {
            throw new Error(`Invalid FLOAT input for '${name}': ${raw}`);
          }
          break;
  
        case Types.LETRA:
          // anything goes as string literal, strip quotes if present
          parsedVal = cleanLiteral(raw.startsWith('"') || raw.startsWith("'") ? raw : `"${raw}"`);
          break;
  
        case Types.TINUOD:
          const valUp = raw.toUpperCase();
          if (valUp !== 'OO' && valUp !== 'DILI') {
            throw new Error(`Invalid TINUOD input for '${name}': ${raw} (expected OO or DILI)`);
          }
          parsedVal = (valUp === 'OO');
          break;
  
        default:
          throw new Error(`Unhandled type '${current.type}' for variable '${name}'.`);
      }
  
      env.assign(name, parsedVal);
    });
  }

  function handleIncDec(expression, env) {
    const isInc = expression.endsWith('++');
    const isDec = expression.endsWith('--');
  
    if (!isInc && !isDec) return false;
  
    const varName = expression.slice(0, -2).trim();
  
    if (!env.variables.has(varName)) {
      throw new Error(`Variable '${varName}' not declared.`);
    }
  
    const current = env.get(varName);
    if (typeof current !== 'number') {
      throw new Error(`Increment/Decrement requires numeric variable: '${varName}'`);
    }
  
    env.assign(varName, isInc ? current + 1 : current - 1);
    return true;
  }
  
   
  function handleLoop(node, env, output) {
    // Initialize loop variables (e.g., a=1)
    handleAssignment(node.init, env);
  
    // Run the loop while the condition is true
    while (evaluateTokens(tokenizeExpression(node.condition), env)) {
      // Execute the body of the loop
      const bodyTokens = tokenize(node.body.join('\n'));
      const bodyAst = parse(bodyTokens);
  
      // Collect and run body output
      const iterationOutput = run(bodyAst, env);
      
      // Append the loop's result to output
      output.push(iterationOutput.join('')); // Concatenate output for one line
  
      // Update loop variable (e.g., a++)
      if (node.update) {
        handleIncDec(node.update, env);
      }
    }
  }
  

  function handleConditionals(node, env, output) {
    for (const branch of node.branches) {
      if (branch.type === 'IF' || branch.type === 'ELSE_IF') {
        const condition = evaluateTokens(tokenizeExpression(branch.condition), env);
        if (condition) {
          const bodyAst = parse(tokenize(branch.body.join('\n')));
          const result = run(bodyAst, env);
          output.push(...result);
          break;
        }
      } else if (branch.type === 'ELSE') {
        const bodyAst = parse(tokenize(branch.body.join('\n')));
        const result = run(bodyAst, env);
        output.push(...result);
        break;
      }
    }
  }
  
  function tokenizeExpression(expr) {
    const regex = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[a-zA-Z_]\w*|==|<>|[><]=?|[()+\-*/%]|UG|O|DILI|\+\+|--|\d+(\.\d+)?/g;
    return expr.match(regex) || [];
  }
  

  function evaluateTokens(tokens, env) {
    const jsExpr = tokens.map(token => {
      switch (token) {
        case 'UG': return '&&';
        case 'O': return '||';
        case 'DILI': return '!';
        case '<>': return '!=';
        case '==': return '==';
        default:
          // ✅ Handle string literals (e.g., 'a' or "a")
          if (/^["'].*["']$/.test(token)) {
            return token; // keep as is, quotes included
          }
  
          // ✅ Handle boolean literals
          if (token === 'OO') return 'true';
          if (token === 'DILI') return 'false';
  
          // ✅ Handle variable
          if (/^[a-zA-Z_]\w*$/.test(token)) {
            if (!env.variables.has(token)) {
              throw new Error(`Variable '${token}' is not defined.`);
            }
            return JSON.stringify(env.get(token)); // wrap value in JS literal
          }
  
          // ✅ Otherwise: number or operator
          return token;
      }
    }).join(' ');
  
    try {
      return eval(jsExpr);
    } catch (e) {
      throw new Error(`Invalid expression: ${jsExpr}`);
    }
  }
  
  
  function handlePrint(expr, env) {
    const segments = [];
    let buf = '';
    let i = 0;
  
    // 1) Tokenize into meaningful segments
    while (i < expr.length) {
      // a) Escape code [x]
      if (expr[i] === '[' && i + 2 < expr.length && expr[i+2] === ']') {
        if (buf) { segments.push(buf); buf = ''; }
        segments.push(expr.slice(i, i+3));
        i += 3;
        continue;
      }
  
      // b) String literal
      if (expr[i] === '"' || expr[i] === "'") {
        const quote = expr[i];
        let j = i + 1;
        while (j < expr.length && expr[j] !== quote) j++;
        if (buf) { segments.push(buf); buf = ''; }
        segments.push(expr.slice(i, j+1));
        i = j + 1;
        continue;
      }
  
      // c) Concatenator &
      if (expr[i] === '&') {
        if (buf) { segments.push(buf); buf = ''; }
        segments.push('&');
        i++;
        continue;
      }
  
      // d) Newline marker $
      if (expr[i] === '$') {
        if (buf) { segments.push(buf); buf = ''; }
        segments.push('$');
        i++;
        continue;
      }
  
      // e) Everything else
      buf += expr[i++];
    }
    if (buf) segments.push(buf);
  
    // 2) Drop any pure‐whitespace segments
    const cleanSegments = segments.filter(s => s.trim() !== '');
  
    // 3) Build the line, replacing $ with real newlines
    let line = '';
    for (const seg of cleanSegments) {
      if (seg === '&') {
        // concatenator: do nothing
        continue;
      }
      if (seg === '$') {
        line += '\n';
        continue;
      }
  
      // escape code [x]
      const m = seg.match(/^\[(.)\]$/);
      if (m) {
        line += m[1];
        continue;
      }
  
      // string literal
      if (/^".*"$|^'.*'$/.test(seg)) {
        line += cleanLiteral(seg);
        continue;
      }
  
      // identifier
      if (/^[a-zA-Z_]\w*$/.test(seg)) {
        const v = env.get(seg);
        if (v === undefined) throw new Error(`Variable '${seg}' is not defined.`);
        if (v === true)  { line += 'OO'; continue; }
        if (v === false) { line += 'DILI'; continue; }
        line += String(v);
        continue;
      }
  
      // numeric literal
      if (/^[+-]?\d+(\.\d+)?$/.test(seg)) {
        line += seg;
        continue;
      }
  
      // otherwise, evaluate as expression
      const val = evaluateTokens(tokenizeExpression(seg), env);
      line += String(val);
    }
  
    // 4) Split out any internal newlines into separate lines
    return line
      .split('\n')
      .filter(l => l !== '');
  }
  
  
  
  
  
  