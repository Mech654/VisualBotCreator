import { Node, Port, NodeProperties } from '../base.js';
import * as math from 'mathjs';
import { ComponentCategory } from '../nodeSystem.js';

export interface MathNodeProperties extends NodeProperties {
  expression: string;
  variables?: Record<string, number>;
  nodeContent?: string; // Add nodeContent property
}

export class MathNode extends Node {
  // Use ComponentCategory enum for consistent categorization
  static metadata = {
    name: 'Math',
    category: ComponentCategory.DATA_PROCESSING,
    description: 'Perform mathematical operations on numerical inputs',
    flowType: 'data',
    icon: '🧮',
  };

  static override shownProperties = ['expression'];

  constructor(id: string, properties: MathNodeProperties = { expression: 'a + b' }) {
    // Default to a simple expression if none provided
    if (!properties.expression) {
      properties.expression = 'a + b';
    }

    properties.variables = properties.variables || {};

    // Generate the node content for display - but without using 'this'
    properties.nodeContent = `<p class="math-expression-display">${properties.expression}</p>`;

    super(id, 'math', properties);

    // Add control flow ports for previous/next connections
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));

    // Add data ports - simplified to have dynamic inputs
    this.addInput(new Port('a', 'Variable A', 'number'));
    this.addInput(new Port('b', 'Variable B', 'number'));
    this.addInput(new Port('expression', 'Expression', 'string'));
    this.addOutput(new Port('result', 'Result', 'number'));
    this.addOutput(new Port('error', 'Error', 'string'));
  }

  /**
   * Update the node content whenever the expression changes
   */
  updateNodeContent() {
    this.properties.nodeContent = `<p class="math-expression-display">${this.properties.expression}</p>`;
    return this.properties.nodeContent;
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    try {
      // Get the expression from inputs or properties
      const expression = inputValues['expression'] || this.properties.expression;

      // Create a scope with variable values from inputs
      const scope: Record<string, number> = {
        ...this.properties.variables, // Default values from properties
      };

      // Add inputs to scope
      Object.keys(inputValues).forEach(key => {
        // Only add number inputs to scope (skip control flows and expression input)
        if (key !== 'previous' && key !== 'expression') {
          const value = Number(inputValues[key] || 0);
          scope[key] = isNaN(value) ? 0 : value;
        }
      });

      // Evaluate the expression with the scope
      const result = math.evaluate(expression, scope);

      // Return the result and clear any previous errors
      return {
        result: result,
        error: null,
      };
    } catch (error) {
      // Return an error message if evaluation fails
      return {
        result: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
