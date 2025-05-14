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

      env.declare(name, type, value);
    });
  }




  function handleAssignment(line, env) {
    if (!line.includes('=')) {
      throw new Error(`Missing '=' in assignment: ${line}`);
    }

    const parts = line.split('=').map(s => s.trim());
    const expression = parts.pop();
    const lhsParts = parts;

    const targetVars = lhsParts
      .flatMap(p => p.split(',').map(v => v.trim()))
      .filter(Boolean);

  
    const tokens = tokenizeExpression(expression);
    const value = evaluateTokens(tokens, env);


    targetVars
      .reverse()
      .forEach(varName => {
        if (!env.variables.has(varName)) {
          throw new Error(`Variable '${varName}' not declared.`);
        }
        env.assign(varName, value);
      });
  }
  

  function handleInput(line, env) {
    const variables = line.slice(6).split(',').map(v => v.trim());
  
    variables.forEach(name => {
      const current = env.variables.get(name);
      if (!current) throw new Error('Error');
  
      const inputLine = readlineSync.question(`Enter value: `);
      const raw = inputLine.trim();
  
      let parsedVal;
      switch (current.type) {
        case Types.NUMERO:
          parsedVal = parseInt(raw, 10);
          if (isNaN(parsedVal)) {
            throw new Error(`Error`);
          }
          break;
  
        case Types.TIPIK:
          parsedVal = parseFloat(raw);
          if (isNaN(parsedVal)) {
            throw new Error(`Error`);
          }
          break;
  
        case Types.LETRA:
          parsedVal = cleanLiteral(raw);
          break;
  
        case Types.TINUOD:
          const valUp = raw.toUpperCase();
          if (valUp !== 'OO' && valUp !== 'DILI') {
            throw new Error(`Error`);
          }
          parsedVal = valUp;
          break;
  
        default:
          throw new Error(`Error`);
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
    
    handleAssignment(node.init, env);
  
    while (evaluateTokens(tokenizeExpression(node.condition), env)) {
      const bodyTokens = tokenize(node.body.join('\n'));
      const bodyAst = parse(bodyTokens);
  
      const iterationOutput = run(bodyAst, env);
      
      output.push(iterationOutput.join(''));
  
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
          if (/^["'].*["']$/.test(token)) {
            return token; 
          }
  
          
          if (token === 'OO') return 'true';
          if (token === 'DILI') return 'false';
  
          
          if (/^[a-zA-Z_]\w*$/.test(token)) {
            if (!env.variables.has(token)) {
              throw new Error(`Variable '${token}' is not defined.`);
            }
            return JSON.stringify(env.get(token)); 
          }
  
          
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
  
   
    while (i < expr.length) {
      
      if (expr[i] === '[' && i + 2 < expr.length && expr[i+2] === ']') {
        if (buf) { segments.push(buf); buf = ''; }
        segments.push(expr.slice(i, i+3));
        i += 3;
        continue;
      }
  
      
      if (expr[i] === '"' || expr[i] === "'") {
        const quote = expr[i];
        let j = i + 1;
        while (j < expr.length && expr[j] !== quote) j++;
        if (buf) { segments.push(buf); buf = ''; }
        segments.push(expr.slice(i, j+1));
        i = j + 1;
        continue;
      }
  
      
      if (expr[i] === '&') {
        if (buf) { segments.push(buf); buf = ''; }
        segments.push('&');
        i++;
        continue;
      }
  
     
      if (expr[i] === '$') {
        if (buf) { segments.push(buf); buf = ''; }
        segments.push('$');
        i++;
        continue;
      }
  
      
      buf += expr[i++];
    }
    if (buf) segments.push(buf);
  
    const cleanSegments = segments.filter(s => s.trim() !== '');
  
    let line = '';
    for (const seg of cleanSegments) {
      if (seg === '&') {
        continue;
      }
      if (seg === '$') {
        line += '\n';
        continue;
      }
  
      const m = seg.match(/^\[(.)\]$/);
      if (m) {
        line += m[1];
        continue;
      }
  
      if (/^".*"$|^'.*'$/.test(seg)) {
        line += cleanLiteral(seg);
        continue;
      }
  
      if (/^[a-zA-Z_]\w*$/.test(seg)) {
        const v = env.get(seg);
        if (v === undefined) throw new Error(`Variable '${seg}' is not defined.`);
        if (v === true)  { line += 'OO'; continue; }
        if (v === false) { line += 'DILI'; continue; }
        line += String(v);
        continue;
      }
  
      if (/^[+-]?\d+(\.\d+)?$/.test(seg)) {
        line += seg;
        continue;
      }
  
      const val = evaluateTokens(tokenizeExpression(seg), env);
      line += String(val);
    }
  
    return line
      .split('\n')
      .filter(l => l !== '');
  }
  
  
  
  
  
  