export function tokenize(code) {
    const lines = code.split('\n');
    const tokens = [];
  
    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('--')) return;  
  
      const token = { type: 'LINE', value: line }; 
      tokens.push(token);
    });
  
    return tokens;
  }
  