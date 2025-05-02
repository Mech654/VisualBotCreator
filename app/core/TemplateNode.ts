// TemplateNode.ts - A template guide for creating new nodes
import { Node, Port, NodeProperties } from './base.js';
import { ComponentCategory } from './nodeSystem.js';

/**
 * QUICK GUIDE - NODE CREATION STEPS:
 * ----------------------------------
 * 1. Define Properties Interface - Define what data your node stores
 * 2. Create Node Class - Extend the base Node class
 * 3. Define Metadata - Set name, category, icon, etc. for the component panel
 * 4. Constructor - Initialize properties and visualize your node
 * 5. Add Ports - Define how your node connects to other nodes
 * 6. Update Content - Make the node update its visualization when properties change
 * 7. Properties Panel - Create UI controls for editing node properties
 * 8. Event Listeners - Connect UI controls to update node properties
 * 9. Process Method - Implement the node's behavior/functionality
 * 10. Register Node - Add your node to the system (in nodeSystem.ts)
 * ----------------------------------
 */

/**
 * Step 1: Define the properties interface for your node
 * PURPOSE: Define what data your node stores and passes to the renderer
 * These properties will be saved with the flow and available when the node runs
 */
export interface TemplateNodeProperties extends NodeProperties {
  /**
   * Example: A custom property for your node
   */
  customValue?: string;

  /**
   * All nodes should have the nodeContent property to provide their own visualization
   * This is what appears in the node body on the canvas
   */
  nodeContent?: string;

  /**
   * Add any other custom properties your node needs
   * Make optional properties with ? or provide defaults in the constructor
   */
  someNumber?: number;
  someFlag?: boolean;
}

/**
 * Step 2: Create your node class extending from the base Node class
 * PURPOSE: This forms the backbone of your node's functionality and behavior
 */
export class TemplateNode extends Node {
  /**
   * Step 3: Define static metadata for your node
   * PURPOSE: This information appears in the component panel and helps categorize your node
   */
  static metadata = {
    name: 'Template', // Display name in the component panel
    category: ComponentCategory.DATA_PROCESSING, // Category for organization in the UI
    description: 'A template for creating nodes', // Description shown as tooltip
    flowType: 'data', // 'flow' or 'data' based on primary function
    icon: '📋', // Icon to display in the UI
  };

  /**
   * shownProperties controls which properties are displayed on the node component in the UI.
   * Add property names to this array to make them visible and live-updating on the node.
   * Example: static override shownProperties = ['customValue', 'someNumber'];
   */
  static override shownProperties: string[] = [];

  /**
   * Step 4: Create the constructor
   * PURPOSE: Initialize your node with default values and set its initial appearance
   * This runs when a node is first created or loaded from saved data
   */
  constructor(id: string, properties: TemplateNodeProperties = {}) {
    // Set default values for properties
    properties.title = properties.title || 'Template';
    properties.customValue = properties.customValue || 'Default value';
    properties.someNumber = properties.someNumber ?? 42; // Using ?? for null/undefined check
    properties.someFlag = properties.someFlag ?? false;

    // Generate the node content visualization BEFORE calling super()
    // This avoids "super() must be called before accessing 'this'" error
    // PURPOSE: Create the visual representation of your node on the canvas
    properties.nodeContent = `
            <div class="template-node-content">
                <div class="template-value">${properties.customValue}</div>
                <div class="template-number">${properties.someNumber}</div>
            </div>
        `;

    // Call super with the node id, type, and properties
    super(id, 'template', properties);

    /**
     * Step 5: Add input and output ports
     * PURPOSE: Define the connection points for your node
     * These determine how your node can connect to other nodes in the flow
     */

    // Control flow ports (if your node should be part of a flow sequence)
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));

    // Data ports - for passing data values between nodes
    this.addInput(new Port('input1', 'Input 1', 'string'));
    this.addInput(new Port('input2', 'Input 2', 'number'));
    this.addOutput(new Port('output', 'Output', 'string'));
  }

  /**
   * Step 6: Update the node content when properties change
   * PURPOSE: Keep the node's visual appearance in sync with its properties
   * Call this method whenever a property changes that should affect the node's appearance
   */
  updateNodeContent() {
    this.properties.nodeContent = `
            <div class="template-node-content">
                <div class="template-value">${this.properties.customValue}</div>
                <div class="template-number">${this.properties.someNumber}</div>
            </div>
        `;
    return this.properties.nodeContent;
  }

  /**
   * Step 7: Generate the HTML for the properties panel
   * PURPOSE: Create the UI controls that appear in the right panel when the node is selected
   * This is where users will edit the node's properties and configure its behavior
   */
  generatePropertiesPanel(): string {
    return `
            <div class="property-group-title">Template Settings</div>
            
            <div class="property-item" data-tooltip="Enter a value for this template node">
                <div class="property-label">Custom Value</div>
                <input type="text" class="property-input template-value-input" 
                       value="${this.properties.customValue || ''}">
            </div>
            
            <div class="property-item" data-tooltip="Enter a number">
                <div class="property-label">Some Number</div>
                <input type="number" class="property-input template-number-input" 
                       value="${this.properties.someNumber || 0}">
            </div>
            
            <div class="property-item" data-tooltip="Toggle some feature">
                <div class="property-label">Some Flag</div>
                <label class="switch">
                    <input type="checkbox" class="template-flag-input" 
                           ${this.properties.someFlag ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="property-item">
                <div class="property-label">Documentation</div>
                <div class="property-value">
                    <p>This is a template node that shows how to create new nodes.</p>
                    <p>Add helpful documentation here to explain your node's purpose and usage.</p>
                </div>
            </div>
        `;
  }

  /**
   * Step 8: Set up event listeners for the properties panel
   * PURPOSE: Connect UI changes to node properties
   * This is how changes in the property panel affect the node's properties and appearance
   */
  setupPropertyEventListeners(panel: HTMLElement): void {
    // Get references to input elements
    const valueInput = panel.querySelector('.template-value-input') as HTMLInputElement;
    const numberInput = panel.querySelector('.template-number-input') as HTMLInputElement;
    const flagInput = panel.querySelector('.template-flag-input') as HTMLInputElement;

    // Set up event listeners
    if (valueInput) {
      valueInput.addEventListener('change', () => {
        this.properties.customValue = valueInput.value;
        this.updateNodeContent(); // Update node visualization after change
      });
    }

    if (numberInput) {
      numberInput.addEventListener('change', () => {
        this.properties.someNumber = Number(numberInput.value);
        this.updateNodeContent();
      });
    }

    if (flagInput) {
      flagInput.addEventListener('change', () => {
        this.properties.someFlag = flagInput.checked;
        // Note: We don't need to update node content here if the flag
        // doesn't affect the visual appearance
      });
    }
  }

  /**
   * Step 9: Implement the process method
   * PURPOSE: Define what your node actually does when executed in the flow
   * This is the core logic/functionality of your node
   *
   * @param inputValues Values from connected input ports
   * @returns Object with output values keyed by output port ids
   */
  process(inputValues: Record<string, any>): Record<string, any> {
    // Get input values or use defaults
    const input1 = inputValues['input1'] || '';
    const input2 = Number(inputValues['input2'] || 0);

    // Access node properties
    const customValue = this.properties.customValue || '';
    const someFlag = this.properties.someFlag || false;

    // Process the inputs based on node logic
    let result = customValue + ': ' + input1;

    if (someFlag) {
      result += ' (' + input2 + ')';
    }

    // Return output values
    return {
      output: result,
    };
  }
}

/**
 * Step 10: Register your node in nodeSystem.ts
 * PURPOSE: Make your node available in the application
 *
 * After creating your node, you need to add it to the nodeSystem.ts file:
 * 1. Import your node: import { YourNode } from './components/YourNode.js';
 * 2. Add it to the componentRegistry: componentRegistry.set('yourNodeType', YourNode);
 */

/**
 * HOW TO USE THIS TEMPLATE:
 *
 * 1. Copy this file and rename it to YourNodeName.ts in the components folder
 * 2. Replace "Template" with your node name throughout the file
 * 3. Define your specific node properties in the interface
 * 4. Customize the visualization in updateNodeContent() method
 * 5. Add appropriate ports in the constructor based on your node's needs
 * 6. Create a custom properties panel in generatePropertiesPanel()
 * 7. Handle property changes in setupPropertyEventListeners()
 * 8. Implement your node's logic in the process() method
 * 9. Register your node in nodeSystem.ts to make it available
 *
 * Once registered, your node will appear in the component panel and can be
 * used in your bot's visual flow!
 */
