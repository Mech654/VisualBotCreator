import { Node, Port, NodeProperties } from '../base.js';
import * as math from 'mathjs';
import { ComponentCategory } from '../nodeSystem.js';

export interface MathNodeProperties extends NodeProperties {
  expression: string;
  variables?: Record<string, number>;
  nodeContent?: string;
}

export class MathNode extends Node {
  static metadata = {
    name: 'Math',
    category: ComponentCategory.DATA_PROCESSING,
    description: 'Perform mathematical operations on numerical inputs',
    flowType: 'data',
    icon: '🧮',
  };

  static override shownProperties = ['expression'];

  constructor(id: string, properties: MathNodeProperties = { expression: 'a + b' }) {
    if (!properties.expression) {
      properties.expression = 'a + b';
    }
    properties.variables = properties.variables || {};
    properties.nodeContent = `<p class="math-expression-display">${properties.expression}</p>`;
    super(id, 'math', properties);
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addInput(new Port('a', 'Variable A', 'number'));
    this.addInput(new Port('b', 'Variable B', 'number'));
    this.addInput(new Port('expression', 'Expression', 'string'));
    this.addOutput(new Port('result', 'Result', 'number'));
    this.addOutput(new Port('error', 'Error', 'string'));
  }

  updateNodeContent() {
    this.properties.nodeContent = `<p class="math-expression-display">${this.properties.expression}</p>`;
    return this.properties.nodeContent;
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    try {
      const expression = inputValues['expression'] || this.properties.expression;
      const scope: Record<string, number> = {
        ...this.properties.variables,
      };
      Object.keys(inputValues).forEach(key => {
        if (key !== 'previous' && key !== 'expression') {
          const value = Number(inputValues[key] || 0);
          scope[key] = isNaN(value) ? 0 : value;
        }
      });
      const result = math.evaluate(expression, scope);
      return {
        result: result,
        error: null,
      };
    } catch (error) {
      return {
        result: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
