# Bisaya++ Interpreter

## Overview

The Bisaya++ Interpreter is an implementation of a **strongly-typed, high-level programming language** designed to teach the basics of programming using Cebuano (Bisaya) keywords. This interpreter allows you to run **Bisaya++** programs, which have simple syntax and native Cebuano keywords. 

### Features:
- **Variable Declarations** with types like `NUMERO`, `LETRA`, and `TINUOD`.
- **Conditional Statements** (`KUNG`, `KUNG WALA`, `KUNG DILI`). (NOT YET IMPLEMENTED)
- **Loops** (`ALANG SA` for `for` loops). (NOT YET IMPLEMENTED)
- **Arithmetic and Logical Operations**.
- **Input/Output** with `DAWAT` for input and `IPAKITA` for output.
  
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
     node interpreter/index.js
     ```

### Sample Bisaya++ Program

Here’s a simple **Bisaya++** program that can be found in the `examples/sample.bpp` file:

```bpp
-- this is a sample program in Bisaya++
SUGOD
MUGNA NUMERO x, y, z=5
MUGNA LETRA a_1='n'
MUGNA TINUOD t="OO"
x=y=4
a_1='c'
-- this is a comment
IPAKITA: x & t & z & $ & a_1 & [#] & "last"
KATAPUSAN
