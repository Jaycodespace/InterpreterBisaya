export function cleanLiteral(value) {
    return value.replace(/['"’]/g, '');
  }
  
  export function isNumeric(val) {
    return !isNaN(val);
  }
    