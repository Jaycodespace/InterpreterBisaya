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
            const conditionalNode = parseConditional(lines, i);
            ast.push(conditionalNode.node);
            i = conditionalNode.nextIndex;
        } else if (line.startsWith('ALANG SA')) {
            // Handle ALANG SA (for loop) explicitly
            const loopNode = { type: 'LOOP', line, block: [] };
            const loopExpr = line.slice(9, -1).trim(); // Remove "ALANG SA (" and ")"
            const [initialization, condition, update] = loopExpr.split(',').map(s => s.trim());

            // Create a proper representation for the loop
            loopNode.initialization = initialization;
            loopNode.condition = condition;
            loopNode.update = update;

            // Parse the block after the condition
            i++; // Move to the next line to parse the block
            while (i < lines.length && !lines[i].trim().startsWith('}')) {
                const statementLine = lines[i].trim();
                if (statementLine.startsWith('IPAKITA:')) {
                    loopNode.block.push({
                        type: 'PRINT',
                        expression: statementLine.slice(8).trim(),
                    });
                } else if (statementLine.includes('=')) {
                    loopNode.block.push({
                        type: 'ASSIGNMENT',
                        line: statementLine,
                    });
                }
                i++;
            }

            ast.push(loopNode);
        } else if (line.startsWith('DAWAT')) {
            ast.push({ type: 'INPUT', line });
        } else if (line.includes('=')) {
            ast.push({ type: 'ASSIGNMENT', line });
        }

        i++;
    }

    return ast;
}

function parseConditional(lines, startIndex) {
    const conditionalNode = { type: 'CONDITIONAL', line: lines[startIndex].trim(), block: [], isElse: false };
    let i = startIndex;

    // Check if this is a "KUNG WALA" block
    if (conditionalNode.line.startsWith('KUNG WALA')) {
        conditionalNode.isElse = true;
    } else {
        // Check if "PUNDOK{" is on the same line
        if (conditionalNode.line.includes('PUNDOK{')) {
            // Extract the condition part (everything before "PUNDOK{")
            const conditionPart = conditionalNode.line.split('PUNDOK{')[0].trim().slice(4).trim(); // Remove "KUNG"
            conditionalNode.condition = conditionPart;
        } else {
            // Ensure the next line is "PUNDOK{"
            i++;
            if (i >= lines.length || !lines[i].trim().startsWith('PUNDOK{')) {
                throw new Error(`Expected PUNDOK{ after KUNG statement: ${lines[startIndex].trim()}`);
            }
            i++; // Move past "PUNDOK{"

            // Extract the condition part
            const conditionPart = conditionalNode.line.slice(4).trim(); // Remove "KUNG"
            conditionalNode.condition = conditionPart;
        }
    }

    // Parse the block inside PUNDOK{
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

    // Ensure the block ends with "}"
    if (i >= lines.length || !lines[i].trim().startsWith('}')) {
        throw new Error(`Expected closing } for KUNG block: ${lines[startIndex].trim()}`);
    }
    i++; // Move past "}"

    return { node: conditionalNode, nextIndex: i };
}
