export function parse(tokens) {
    const ast = [];
    const lines = tokens.map(token => token.value); // Extract lines from tokens

    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();

        if (line.startsWith('MUGNA')) {
            ast.push({ type: 'DECLARATION', line });
        } else if (line.startsWith('IPAKITA:')) {
            ast.push({ type: 'PRINT', expression: line.slice(8).trim() });
        } else if (line.startsWith('KUNG')) {
            // Parse the conditional block
            const conditionalNode = { type: 'CONDITIONAL', line, block: [] };
            i++; // Move to the next line to parse the block

            while (i < lines.length && !lines[i].trim().startsWith('}')) {
                const statementLine = lines[i].trim();
                if (statementLine.startsWith('IPAKITA:')) {
                    conditionalNode.block.push({
                        type: 'PRINT',
                        expression: statementLine.slice(8).trim(),
                    });
                } else if (statementLine.includes('=')) {
                    conditionalNode.block.push({
                        type: 'ASSIGNMENT',
                        line: statementLine,
                    });
                }
                i++;
            }

            ast.push(conditionalNode);
        } else if (line.startsWith('ALANG SA')) {
            ast.push({ type: 'LOOP', line });
        } else if (line.startsWith('DAWAT')) {
            ast.push({ type: 'INPUT', line });
        } else if (line.includes('=')) {
            ast.push({ type: 'ASSIGNMENT', line });
        }

        i++;
    }

    return ast;
}