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
    } else if (line.startsWith('KUNG')) {
      const { node, nextIndex } = parseConditional(lines, i);
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
  if (!loopHeaderMatch) throw new Error(`Invalid ALANG SA syntax: ${header}`);

  const [init, condition, update] = loopHeaderMatch[1].split(',').map(part => part.trim());
  if (lines[startIndex + 1].trim() !== 'PUNDOK{') throw new Error(`Expected PUNDOK{ after ALANG SA`);

  const body = [];
  let braceCount = 1, i = startIndex + 2;

  while (i < lines.length && braceCount > 0) {
    const line = lines[i].trim();
    if (line === 'PUNDOK{') braceCount++;
    else if (line === '}') braceCount--;
    if (braceCount > 0) body.push(lines[i]);
    i++;
  }

  return { node: { type: 'FOR_LOOP', init, condition, update, body }, nextIndex: i };
}

function parseConditional(lines, startIndex) {
  const branches = [];

  let i = startIndex;

  // Loop through the lines starting at startIndex
  while (i < lines.length) {
    let line = lines[i].trim();

    if (line.startsWith('KUNG DILI')) {
      const cond = line.match(/\(([^)]+)\)/);
      if (!cond) throw new Error(`Invalid KUNG DILI condition`);
      // Parse the block of code that follows this condition
      const { body, nextIndex } = parseBlock(lines, i + 1);
      // Add the parsed ELSE_IF branch to the branches array
      branches.push({ type: 'ELSE_IF', condition: cond[1], body });
      i = nextIndex;


    } else if (line.startsWith('KUNG WALA')) {
      // Parse the block of code that follows this else
      const { body, nextIndex } = parseBlock(lines, i + 1);
      // Add the parsed ELSE branch (no condition) to the branches array
      branches.push({ type: 'ELSE', body });
      // Move to the next unparsed line
      i = nextIndex;


    } else if (line.startsWith('KUNG')) {
      const cond = line.match(/\(([^)]+)\)/);
      if (!cond) throw new Error(`Invalid KUNG condition`);
      // Parse the block of code that follows this condition
      const { body, nextIndex } = parseBlock(lines, i + 1);
      // Add the parsed IF branch to the branches array
      branches.push({ type: 'IF', condition: cond[1], body });

      // Move to the next unparsed line
      i = nextIndex;
    } else {
      break;
    }
  }

  // Return the constructed conditional node 
  return { node: { type: 'CONDITIONAL', branches }, nextIndex: i };
}


function parseBlock(lines, startIndex) {
  if (lines[startIndex].trim() !== 'PUNDOK{') throw new Error(`Expected PUNDOK{`);
  const body = [];
  let braceCount = 1, i = startIndex + 1;

  while (i < lines.length && braceCount > 0) {
    const line = lines[i].trim();
    if (line === 'PUNDOK{') braceCount++;
    else if (line === '}') braceCount--;
    if (braceCount > 0) body.push(lines[i]);
    i++;
  }

  if (braceCount !== 0) throw new Error(`Missing closing }`);
  return { body, nextIndex: i };
}
