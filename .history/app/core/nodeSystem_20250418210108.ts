import { Node, Port, Connection } from './base.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module compatible approach to get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import all standard components explicitly
import { StartNode } from './components/StartNode.js';
import { MessageNode } from './components/MessageNode.js';
import { OptionsNode } from './components/OptionsNode.js';
import { ConditionNode } from './components/ConditionNode.js';
import { InputNode } from './components/InputNode.js';
import { MathNode } from './components/MathNode.js';

export interface NodeComponent {
  new (id: string, properties?: any): Node;
  metadata?: {
    name?: string;
    category?: string;
    description?: string;
    icon?: string;
    flowType?: 'flow' | 'data';
  };
}

export class NodeFactory {
  private static nodeTypes: Record<string, NodeComponent> = {};
  private static componentsDir = path.join(__dirname, 'components');
  private static isInitialized = false;

  /**
   * Dynamically discover and load all components from the components directory
   */
  static async discoverComponents(): Promise<void> {
    if (this.isInitialized) return;

    // First, register our built-in components to ensure they're always available
    this.registerNodeType('start', StartNode);
    this.registerNodeType('message', MessageNode);
    this.registerNodeType('options', OptionsNode);
    this.registerNodeType('condition', ConditionNode);
    this.registerNodeType('input', InputNode);
    this.registerNodeType('math', MathNode);

    try {
      // Get all JavaScript files in the components directory (after compilation)
      const files = fs.readdirSync(this.componentsDir)
        .filter(file => file.endsWith('.js') &&
          !file.includes('index.js') &&
          // Exclude already registered components to avoid duplicates
          !['StartNode.js', 'MessageNode.js', 'OptionsNode.js',
            'ConditionNode.js', 'InputNode.js', 'MathNode.js'].includes(file));

      // Import each component dynamically
      for (const file of files) {
        try {
          // Get the component name without extension
          const componentName = file.replace('.js', '');

          // Skip if we've already registered this component
          if (this.getTypeFromComponentName(componentName) in this.nodeTypes) {
            continue;
          }

          // Load the component module
          const componentModule = await import(`./components/${file}`);

          // Get the component class from the module
          const ComponentClass = componentModule[componentName];

          if (ComponentClass && typeof ComponentClass === 'function') {
            // Extract the type from the component name (assuming it ends with "Node")
            const type = this.getTypeFromComponentName(componentName);

            // Register the component
            this.registerNodeType(type, ComponentClass);
            console.log(`Dynamically registered component: ${componentName} as type "${type}"`);
          }
        } catch (err) {
          console.error(`Error loading component ${file}:`, err);
        }
      }

      this.isInitialized = true;
    } catch (err) {
      console.error('Error discovering components:', err);
    }

    // Log all registered node types for debugging
    console.log('All registered node types:', Object.keys(this.nodeTypes));
  }

  /**
   * Extract the node type from component name
   */
  private static getTypeFromComponentName(componentName: string): string {
    return componentName.replace(/Node$/, '').toLowerCase();
  }

  static registerNodeType(type: string, componentClass: NodeComponent): void {
    this.nodeTypes[type] = componentClass;
    console.log(`Registered component type: ${type}`);
  }

  static createNode(type: string, id: string, properties: Record<string, any> = {}): Node {
    console.log(`Creating node of type: ${type}, available types:`, Object.keys(this.nodeTypes));

    const NodeClass = this.nodeTypes[type];

    if (!NodeClass) {
      throw new Error(`Unknown node type: ${type}`);
    }

    return new NodeClass(id, properties);
  }

  static getRegisteredTypes(): Array<{ type: string, name: string, category: string }> {
    // Define predefined categories for known component types
    const typeCategories: Record<string, string> = {
      'start': 'Conversation Flow',
      'message': 'Conversation Flow',
      'options': 'Conversation Flow',
      'condition': 'Logic',
      'input': 'Conversation Flow',
      'math': 'Data Processing'
    };

    // Dynamically generate the list based on registered components
    return Object.entries(this.nodeTypes).map(([type, Component]) => {
      // Try to get metadata from component if it has static metadata
      const metadata = (Component as any).metadata || {};

      // Default values for component metadata
      const name = metadata.name || type.charAt(0).toUpperCase() + type.slice(1);

      // Use predefined category if available, otherwise use metadata or default
      const category = typeCategories[type] || metadata.category || 'Components';

      return { type, name, category };
    });
  }

  static getNodeTypes(): string[] {
    return Object.keys(this.nodeTypes);
  }
}

export { Node, Port, Connection };

// Initialize component discovery
NodeFactory.discoverComponents().catch(err => {
  console.error('Failed to discover components:', err);
});

// Export all components
export const Components = {
  StartNode,
  MessageNode,
  OptionsNode,
  ConditionNode,
  InputNode,
  MathNode
};