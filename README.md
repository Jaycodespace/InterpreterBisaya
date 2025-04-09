# Bisaya++ Interpreter

## How to Run the Program

### Prerequisites
Ensure you have the following installed:
- **Node.js** (version 14 or above) - [Download Node.js](https://nodejs.org/)
- **Git** (optional) - [Download Git](https://git-scm.com/)

### Steps to Run

1. **Clone the Repository**:
   - If you haven't already, clone the repository:
     ```bash
     git clone https://github.com/Jaycodespace/InterpreterBisaya.git
     ```

2. **Navigate to the Project Directory**:
   - Go to the `interpreter` folder:
     ```bash
     cd InterpreterBisaya++/interpreter
     ```

3. **Install Dependencies**:
   - Install the required Node.js dependencies:
     ```bash
     npm install
     ```

4. **Run the Program**:
   - Execute the program with Node.js:
     ```bash
     node main.js
     ```

### Sample Bisaya++ Program

You can use the following sample program to test the interpreter:

```javascript
const program = `
SUGOD
    MUGNA NUMERO x, y, z = 5
    MUGNA LETRA a_1 = 'n'
    MUGNA TINUOD t = "OO"
    x = 4
    y = 4
    a_1 = 'c'
    IPAKITA: x & t & z & $ & a_1 & [#] & "last"
KATAPUSAN
`;

const ast = parse(program);
const result = execute(ast);
console.log(result);
