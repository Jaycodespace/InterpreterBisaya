export class Environment {
  constructor() {
    this.variables = new Map();  
  }

  declare(name, type, value) {
    if (this.variables.has(name)) {
      throw new Error(`Variable '${name}' already declared.`);
    }
    this.variables.set(name, { type, value });
  }

  assign(name, value) {
    if (!this.variables.has(name)) {
      throw new Error(`Variable '${name}' not declared.`);
    }
    this.variables.get(name).value = value;
  }

  get(name) {
    const variable = this.variables.get(name);
    return variable ? variable.value : null;  
  }
}
