import { lexer } from './lexer.js'; 

export const parse = (source) => {
    const tokens = lexer(source);
    let current = 0;

    const peek = () => tokens[current];
    const next = () => tokens[current++];

    const parseProgram = () => {
        const statements = [];

        if (next() !== 'SUGOD') throw new Error("Program must start with SUGOD");

        while (peek() && peek() !== 'KATAPUSAN') {
            statements.push(parseStatement());
        }

        if (next() !== 'KATAPUSAN') throw new Error("Program must end with KATAPUSAN");

        return { type: 'Program', body: statements };
    };

    const parseStatement = () => {
        const token = peek();

        if (token === 'MUGNA') return parseDeclaration();
        if (token === 'IPAKITA') return parsePrint();

        return parseAssignment(); // fallback to assignment
    };

    const parseDeclaration = () => {
        next(); // skip MUGNA
        const dataType = next(); // NUMERO, LETRA, etc.

        const declarations = [];

        while (peek() && peek() !== 'MUGNA' && peek() !== 'IPAKITA' && peek() !== 'KATAPUSAN') {
            let name = next();
            let value = null;

            if (peek() === '=') {
                next(); // skip =
                value = next();
            }

            declarations.push({ name, value });

            if (peek() === ',') { // skip comma
                next();
            }  else {
                break;
            }
        }

        return {
            type: 'Declaration',
            dataType,
            declarations
        };
    };

    const parseAssignment = () => {
        const names = [];

        while (peek() && peek().match(/^[A-Z_][A-Z0-9_]*$/i)) {

            names.push(next());

            if (peek() === '=') {
                next(); 
            } else {
                break; 
            }

        }

        const value = next();

        return {
            type: 'Assignment',
            targets: names,
            value
        };
    };


    //Printing Error " ", still have to removed
    const parsePrint = () => {
        next(); // skip IPAKITA
        if (next() !== ':') throw new Error("Expected ':' after IPAKITA");

        const items = [];

        while (peek() && peek() !== 'KATAPUSAN') {
            const token = next();
            if (token === '&') continue;
            if (token === '$') items.push({ type: 'Newline' });
            else if (token === '[' && peek() === '#' && tokens[current + 1] === ']') {
                current += 2; // skip # and ]
                items.push({ type: 'Char', value: '#' });
            } else {
                items.push({ type: 'Identifier', value: token });
            }

            if (peek() === 'KATAPUSAN') break;
        }

        return {
            type: 'Print',
            items
        };
    };

    return parseProgram();
};

export default { parse };
