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
    handleAssignment(node.init, env); // Initialize the loop variables
  
    // Start the loop and evaluate the condition
    while (evaluateTokens(tokenizeExpression(node.condition), env)) {
      // Process the body of the loop (including nested loops)
      const bodyTokens = tokenize(node.body.join('\n'));
      const bodyAst = parse(bodyTokens);
      
      // Execute the body of the loop (it will handle nested loops)
      output.push(...run(bodyAst, env));
  
      // Increment/Decrement logic (this is where we handle ++/--)
      if (node.update) {
        handleIncDec(node.update, env); // Handle the increment/decrement in the update
      }
    }
  }
  
  

  function tokenizeExpression(expr) {
    const regex = /[a-zA-Z_]\w*|==|<>|[><]=?|[()+\-*/%]|UG|O|DILI|\+\+|--|\d+/g;
    return expr.match(regex) || [];
  }

  function evaluateTokens(tokens, env) {
    const jsExpr = tokens.map(token => {
      switch (token) {
        case 'UG':    return '&&';
        case 'O':     return '||';
        case 'DILI':  return '!';
        case '<>':    return '!=';
        case '==':    return '==';
        default:
          // if it's an identifier
          if (/^[a-zA-Z_]\w*$/.test(token)) {
            if (!env.variables.has(token)) {
              throw new Error(`Variable '${token}' is not defined.`);
            }
            const val = env.get(token);
            // Allow null or '' (declared but uninitialized)
            return JSON.stringify(val);
          }
          // number literal or operator/paren
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
    // 1. Build a list of meaningful segments:
    //    - [x] escape codes
    //    - "…" or '…' string literals
    //    - $ newline markers
    //    - & concatenators (we'll skip them later)
    //    - anything else
    const segments = [];
    let buf = '';
    let i = 0;
  
    while (i < expr.length) {
      // a) Escape code [x]
      if (expr[i] === '[' && i + 2 < expr.length && expr[i + 2] === ']') {
        if (buf) { segments.push(buf); buf = ''; }
        segments.push(expr.slice(i, i + 3)); // e.g. "[&]"
        i += 3;
        continue;
      }
  
      // b) String literal
      if (expr[i] === '"' || expr[i] === "'") {
        const quote = expr[i];
        let j = i + 1;
        while (j < expr.length && expr[j] !== quote) j++;
        if (buf) { segments.push(buf); buf = ''; }
        segments.push(expr.slice(i, j + 1)); // e.g. '"hello"'
        i = j + 1;
        continue;
      }
  
      // c) Concatenator
      if (expr[i] === '&') {
        if (buf) { segments.push(buf); buf = ''; }
        segments.push('&');
        i++;
        continue;
      }
  
      // d) Everything else (identifiers, numbers, operators, $)
      buf += expr[i++];
    }
    if (buf) segments.push(buf);
  
    // 2. Process each segment and build the output line
    let line = '';
    for (const seg of segments) {
      if (seg === '&') {
        // concatenator: skip, since we're just building one line
        continue;
      }
  
      if (seg === '$') {
        // newline marker: we don't need this in the loop, so skip it
        continue;
      }
  
      // Escape code
      const m = seg.match(/^\[(.)\]$/);
      if (m) {
        line += m[1];
        continue;
      }
  
      // String literal
      if (/^".*"$|^'.*'$/.test(seg)) {
        line += cleanLiteral(seg);
        continue;
      }
  
      // Identifier
      if (/^[a-zA-Z_]\w*$/.test(seg)) {
        const v = env.get(seg);
        if (v === undefined) throw new Error(`Variable '${seg}' is not defined.`);
        if (v === true) { line += 'OO'; continue; }
        if (v === false) { line += 'DILI'; continue; }
        line += String(v);
        continue;
      }
  
      // Numeric literal
      if (/^[+-]?\d+(\.\d+)?$/.test(seg)) {
        line += seg;
        continue;
      }
  
      // Otherwise: an expression, evaluate it
      const val = evaluateTokens(tokenizeExpression(seg), env);
      line += String(val);
    }
  
    // 3. Return as single-element array so run()'s output.push(... ) is correct
    return [line];
  }
  
  