const { Node, Port } = require('../base');

class MathNode extends Node {
  constructor(id, operation = 'add') {
    super(id, 'math', { operation });
    
    this.addInput(new Port('input1', 'Operand 1', 'number'));
    this.addInput(new Port('input2', 'Operand 2', 'number'));
    this.addOutput(new Port('result', 'Result', 'number'));
  }

  process(inputValues) {
    const { operation } = this.properties;
    const operand1 = inputValues['input1'];
    const operand2 = inputValues['input2'];
    let result;

    switch (operation) {
      case 'add':
        result = operand1 + operand2;
        break;
      case 'subtract':
        result = operand1 - operand2;
        break;
      case 'multiply':
        result = operand1 * operand2;
        break;
      case 'divide':
        result = operand1 / operand2;
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    return { result };
  }
}

module.exports = MathNode;