import { Node, Port, NodeProperties } from '../base.js';
import * as math from 'mathjs';
import { ComponentCategory } from '../nodeSystem.js';

export interface MathNodeProperties extends NodeProperties {
  expression: string;
  variables?: Record<string, number>;
  nodeContent?: string;
  language?: string;
}

export class MathNode extends Node {
  static metadata = {
    name: 'Math',
    category: ComponentCategory.DATA,
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
    properties.language =
      typeof properties.language === 'string' && properties.language.trim() !== ''
        ? properties.language
        : 'JavaScript';
    properties.nodeContent = `<p class="math-expression-display">${properties.expression}</p>`;
    super(id, 'math', properties);
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addInput(new Port('a', 'Variable A', 'number', 'variables'));
    this.addInput(new Port('b', 'Variable B', 'number', 'variables'));
    this.addInput(new Port('expression', 'Expression', 'string', 'expression'));
    this.addOutput(new Port('result', 'Result', 'number', 'expression'));
    this.addOutput(new Port('error', 'Error', 'string', 'expression'));
  }

  updateNodeContent(): string {
    this.properties.nodeContent = `<p class="math-expression-display">${this.properties.expression}</p>`;
    return this.properties.nodeContent as string;
  }

  process(inputValues: Record<string, unknown>): { result: number; error: string | null } {
    try {
      const expression: string =
        typeof inputValues['expression'] === 'string'
          ? inputValues['expression']
          : typeof this.properties.expression === 'string'
            ? this.properties.expression
            : 'a + b';
      const variables =
        this.properties.variables !== undefined &&
        this.properties.variables !== null &&
        typeof this.properties.variables === 'object'
          ? (this.properties.variables as Record<string, number>)
          : {};
      const scope: Record<string, number> = {
        ...variables,
      };
      Object.keys(inputValues).forEach(key => {
        if (key !== 'previous' && key !== 'expression') {
          const rawValue = inputValues[key];
          const value = rawValue !== undefined && rawValue !== null ? Number(rawValue) : 0;
          scope[key] = isNaN(value) ? 0 : value;
        }
      });
      const evalResult: unknown = math.evaluate(expression, scope);
      const result: number = typeof evalResult === 'number' ? evalResult : Number(evalResult);
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
