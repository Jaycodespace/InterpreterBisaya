export function tokenize(code) {
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('--'))
    .map(line => ({ type: 'LINE', value: line }));
}
