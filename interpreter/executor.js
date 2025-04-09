export const execute = (ast) => {
    const variables = {};
    let output = "";

    ast.body.forEach(node => {
        if (node.type === 'Declaration') {
            node.declarations.forEach(decl => {
                let val = decl.value;
                if (val?.startsWith("'") || val?.startsWith('"')) {
                    val = val.slice(1, -1);
                }
                variables[decl.name] = val ?? null;
            });
        }

        else if (node.type === 'Assignment') {
            node.targets.forEach(name => {
                let val = node.value;
                if (val?.startsWith("'") || val?.startsWith('"')) {
                    val = val.slice(1, -1);
                }
                variables[name] = val;
            });
        }

        else if (node.type === 'Print') {
            node.items.forEach(p => {
                if (p.type === 'Newline') output += '\n';
                else if (p.type === 'Char') output += p.value;
                else if (p.type === 'Identifier') {
                    const val = variables[p.value] ?? p.value;
                    output += val;
                }
            });
        }
    });

    return output;
};

export default {execute};
