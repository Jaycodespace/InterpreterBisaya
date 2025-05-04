export function parse(tokens) {
    const ast = [];
    const lines = tokens.map(token => token.value);
    let i = 0;
  
    while (i < lines.length) {
      const line = lines[i].trim();
  
      if (line === 'SUGOD' || line === 'KATAPUSAN') {
        i++;
        continue;
      }
  
      if (line.startsWith('MUGNA')) {
        ast.push({ type: 'DECLARATION', line });
      } else if (line.startsWith('IPAKITA:')) {
        ast.push({ type: 'PRINT', expression: line.slice(8).trim() });
      } else if (line.startsWith('DAWAT')) {
        ast.push({ type: 'INPUT', line });
      } else if (line.startsWith('ALANG SA')) {
        const { node, nextIndex } = parseForLoop(lines, i);
        ast.push(node);
        i = nextIndex;
        continue;
      } else if (line.includes('=')) {
        ast.push({ type: 'ASSIGNMENT', line });
      }
  
      i++;
    }
  
    return ast;
  }
  
  function parseForLoop(lines, startIndex) {
    const header = lines[startIndex].trim();
  
    const loopHeaderMatch = header.match(/\(([^)]+)\)/);
    if (!loopHeaderMatch) {
      throw new Error(`Invalid ALANG SA syntax: ${header}`);
    }
  
    const [init, condition, update] = loopHeaderMatch[1]
      .split(',')
      .map(part => part.trim());
  
    // Check for 'PUNDOK{' on the next line
    if (lines[startIndex + 1].trim() !== 'PUNDOK{') {
      throw new Error(`Expected PUNDOK{ after ALANG SA`);
    }
  
    const body = [];
    let braceCount = 1;
    let i = startIndex + 2;
  
    while (i < lines.length && braceCount > 0) {
      const line = lines[i].trim();
  
      if (line === 'PUNDOK{') {
        braceCount++;
        body.push(lines[i]);
      } else if (line === '}') {
        braceCount--;
        if (braceCount > 0) {
          body.push(lines[i]);
        }
      } else {
        body.push(lines[i]);
      }
  
      i++;
    }
  
    if (braceCount !== 0) {
      throw new Error('Missing closing } for loop block');
    }
  
    return {
      node: {
        type: 'FOR_LOOP',
        init,
        condition,
        update,
        body
      },
      nextIndex: i
    };
  }
  