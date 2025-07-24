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

  constructor(
    id: string,
    properties: MathNodeProperties = { expression: 'a + b' },
    position: { x: number; y: number } = { x: 0, y: 0 }
  ) {
    if (!properties.expression) {
      properties.expression = 'a + b';
    }
    properties.variables = properties.variables || {};
    properties.language =
      typeof properties.language === 'string' && properties.language.trim() !== ''
        ? properties.language
        : 'JavaScript';
    properties.nodeContent = `<p class="math-expression-display">${properties.expression}</p>`;
    super(id, 'math', properties, position);
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
}
