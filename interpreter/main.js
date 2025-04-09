// main.js
import { parse } from './parser.js';
import { execute } from './executor.js';

const program = `
-- this is a sample program in Bisaya++
SUGOD
    MUGNA NUMERO x, y, z=5
    MUGNA LETRA a_1='n'
    MUGNA TINUOD t="OO"
    x = 4
    y = 4
    a_1 = 'c'
    IPAKITA: x & t & z & $ & a_1 & [#] & "last"
KATAPUSAN
`;

const ast = parse(program);
const result = execute(ast);
console.log(result);
