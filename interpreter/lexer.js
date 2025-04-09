
const RESERVED_SYMBOLS = ['=', '&', '$', '[', ']', ':', ',', "'", "#"];
const WHITESPACE = [' ', '\t', '\n'];

export const lexer = (source) => {
    const tokens = [];
    let i = 0;

    const isLetter = (ch) => /[a-zA-Z_]/.test(ch);
    const isDigit = (ch) => /[0-9]/.test(ch);

    while (i < source.length) {
        let ch = source[i];

        // Skip whitespace
        if (WHITESPACE.includes(ch)) {
            i++;
            continue;
        }

        // Skip comments
        if (ch === '-' && source[i+1] === '-') {
            while (i < source.length && source[i] !== '\n') 
            i++;
            continue;
        }

        // Handle identifiers (keywords, variable names)
        if (isLetter(ch)) {
            let start = i;
            while (i < source.length && (isLetter(source[i]) || isDigit(source[i]))) {
                i++;
            }
            tokens.push(source.slice(start, i).toUpperCase());
            continue;
        }

        // Handle numbers
        if (isDigit(ch)) {
            let start = i;
            while (i < source.length && isDigit(source[i])) i++;
            tokens.push(source.slice(start, i));
            continue;
        }

        // Handle strings
        if (ch === "'" || ch === '"') {
            let quote = ch;
            let start = i;
            i++; // skip opening quote
            while (i < source.length && source[i] !== quote) i++;
            i++; // skip closing quote
            tokens.push(source.slice(start, i));
            continue;
        }

        // Handle symbols like =, &, $, etc.
        if (RESERVED_SYMBOLS.includes(ch)) {
            tokens.push(ch);
            i++;
            continue;
        }

        // Unknown character (skip or error)
        i++;
    }

    return tokens;
};

export default {lexer};
