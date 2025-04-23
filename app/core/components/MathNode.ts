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
    icon: '🧮'
  };

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

  /**
   * Override the default property panel with a custom one
   */
  generatePropertiesPanel(): string {
    return `
      <div class="property-group-title">Math Expression</div>
      <div class="property-item" data-tooltip="Enter a mathematical expression using variables like 'a', 'b'">
        <div class="property-label">Expression</div>
        <input type="text" class="property-input math-expression" 
               value="${this.properties.expression || 'a + b'}" 
               aria-label="Math expression">
      </div>
      <div class="property-item" data-tooltip="Test your expression with sample values">
        <div class="property-label">Test Values</div>
        <div class="variable-inputs">
          <div class="variable-row">
            <label>a = </label>
            <input type="number" class="property-input math-var-a" value="0" style="width: 80px;">
            <label style="margin-left: 10px;">b = </label>
            <input type="number" class="property-input math-var-b" value="0" style="width: 80px;">
          </div>
        </div>
      </div>
      <div class="property-item">
        <button class="btn btn-primary test-expression">Test Expression</button>
        <span class="expression-result" style="margin-left: 10px;"></span>
      </div>
      <div class="property-item">
        <div class="property-label">Help</div>
        <div class="math-help">
          <p>Use variables a, b or any other name in your expression.</p>
          <p>Supported: +, -, *, /, ^, sqrt(), sin(), cos(), etc.</p>
          <p>Example: sqrt(a^2 + b^2)</p>
        </div>
      </div>
    `;
  }

  /**
   * Set up event listeners for the math node property panel
   */
  setupPropertyEventListeners(panel: HTMLElement): void {
    // Add event listener for testing the expression
    const testButton = panel.querySelector('.test-expression') as HTMLButtonElement;
    const expressionInput = panel.querySelector('.math-expression') as HTMLInputElement;
    const varAInput = panel.querySelector('.math-var-a') as HTMLInputElement;
    const varBInput = panel.querySelector('.math-var-b') as HTMLInputElement;
    const resultDisplay = panel.querySelector('.expression-result') as HTMLSpanElement;

    if (testButton && expressionInput && varAInput && varBInput && resultDisplay) {
      testButton.addEventListener('click', async () => {
        try {
          const a = Number(varAInput.value);
          const b = Number(varBInput.value);
          const expression = expressionInput.value;

          // Update the expression property
          this.properties.expression = expression;
          
          // Update the node content with the new expression
          this.updateNodeContent();

          // Process the expression with the test values
          const result = this.process({
            a,
            b,
            expression
          });

          if (result.error) {
            resultDisplay.textContent = `Error: ${result.error}`;
            resultDisplay.style.color = 'red';
          } else {
            resultDisplay.textContent = `Result: ${result.result}`;
            resultDisplay.style.color = 'green';
          }
        } catch (error) {
          resultDisplay.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
          resultDisplay.style.color = 'red';
        }
      });

      // Save expression when it changes
      expressionInput.addEventListener('change', () => {
        this.properties.expression = expressionInput.value;
        // Update the node content
        this.updateNodeContent();
      });
    }
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    try {
      // Get the expression from inputs or properties
      const expression = inputValues['expression'] || this.properties.expression;

      // Create a scope with variable values from inputs
      const scope: Record<string, number> = {
        ...this.properties.variables // Default values from properties
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
        error: null
      };
    } catch (error) {
      // Return an error message if evaluation fails
      return {
        result: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}