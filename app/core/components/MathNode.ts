import { Node, Port, NodeProperties } from '../base.js';

export type MathOperation = 'add' | 'subtract' | 'multiply' | 'divide';

export interface MathNodeProperties extends NodeProperties {
  operation: MathOperation;
}

export class MathNode extends Node {
  constructor(id: string, operation: MathOperation = 'add') {
    super(id, 'math', { operation });
    
    this.addInput(new Port('input1', 'Operand 1', 'number'));
    this.addInput(new Port('input2', 'Operand 2', 'number'));
    this.addOutput(new Port('result', 'Result', 'number'));
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    const operation = this.properties.operation as MathOperation;
    const operand1 = Number(inputValues['input1'] || 0);
    const operand2 = Number(inputValues['input2'] || 0);
    let result: number;

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
        result = operand2 !== 0 ? operand1 / operand2 : 0;
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    return { result };
  }
}