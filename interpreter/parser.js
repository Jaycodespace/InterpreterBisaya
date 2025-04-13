export function parse(tokens) {
    const ast = [];
  
    tokens.forEach(token => {
      const line = token.value; 
  
      if (line.startsWith('MUGNA')) {
        ast.push({ type: 'DECLARATION', line });
      } else if (line.startsWith('IPAKITA:')) {
        ast.push({ type: 'PRINT', expression: line.slice(8).trim() });
      } else if (line.includes('=')) {
        ast.push({ type: 'ASSIGNMENT', line });
      } else if (line.startsWith('KUNG')) {
        ast.push({ type: 'CONDITIONAL', line });
      } else if (line.startsWith('ALANG SA')) {
        ast.push({ type: 'LOOP', line });
      }
    });
  
    return ast;
  }
  