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

// Define component categories
export enum ComponentCategory {
  CONVERSATION_FLOW = 'Conversation Flow',
  LOGIC = 'Logic',
  DATA_PROCESSING = 'Data Processing',
  INPUT_OUTPUT = 'Input/Output',
  MEDIA = 'Media',
  VARIABLES = 'Variables',
  OTHER = 'Other'
}

export interface NodeComponent {
  new (id: string, properties?: any): Node;
  metadata?: {
    name?: string;
    category?: ComponentCategory | string;
    description?: string;
    icon?: string;
    flowType?: 'flow' | 'data';
  };
}

/**
 * Static metadata for built-in components
 */
// Add metadata to StartNode
(StartNode as NodeComponent).metadata = {
  name: 'Start',
  category: ComponentCategory.CONVERSATION_FLOW,
  description: 'Entry point for the bot conversation',
  flowType: 'flow'
};

// Add metadata to MessageNode
(MessageNode as NodeComponent).metadata = {
  name: 'Message',
  category: ComponentCategory.CONVERSATION_FLOW,
  description: 'Send a message to the user',
  flowType: 'flow'
};

// Add metadata to OptionsNode
(OptionsNode as NodeComponent).metadata = {
  name: 'Options',
  category: ComponentCategory.CONVERSATION_FLOW,
  description: 'Present options to the user',
  flowType: 'flow'
};

// Add metadata to ConditionNode
(ConditionNode as NodeComponent).metadata = {
  name: 'Condition',
  category: ComponentCategory.LOGIC,
  description: 'Evaluate a condition and branch flow',
  flowType: 'flow'
};

// Add metadata to InputNode
(InputNode as NodeComponent).metadata = {
  name: 'Input',
  category: ComponentCategory.INPUT_OUTPUT,
  description: 'Get input from the user',
  flowType: 'flow'
};

// Add metadata to MathNode
(MathNode as NodeComponent).metadata = {
  name: 'Math',
  category: ComponentCategory.DATA_PROCESSING,
  description: 'Perform mathematical operations',
  flowType: 'data'
};

export class NodeFactory {
  private static nodeTypes: Record<string, NodeComponent> = {};
  private static componentsDir = path.join(__dirname, 'components');
  private static isInitialized = false;
  
  /**
   * Map of type names to categories - used for auto-categorization of new components
   */
  private static typeCategories: Record<string, ComponentCategory> = {
    // Conversation Flow
    'start': ComponentCategory.CONVERSATION_FLOW,
    'message': ComponentCategory.CONVERSATION_FLOW,
    'options': ComponentCategory.CONVERSATION_FLOW,
    'dialog': ComponentCategory.CONVERSATION_FLOW,
    'chat': ComponentCategory.CONVERSATION_FLOW,
    'response': ComponentCategory.CONVERSATION_FLOW,
    
    // Logic
    'condition': ComponentCategory.LOGIC,
    'if': ComponentCategory.LOGIC,
    'switch': ComponentCategory.LOGIC,
    'branch': ComponentCategory.LOGIC,
    'loop': ComponentCategory.LOGIC,
    'logic': ComponentCategory.LOGIC,
    'function': ComponentCategory.LOGIC,
    
    // Data Processing
    'math': ComponentCategory.DATA_PROCESSING,
    'data': ComponentCategory.DATA_PROCESSING,
    'text': ComponentCategory.DATA_PROCESSING,
    'string': ComponentCategory.DATA_PROCESSING,
    'number': ComponentCategory.DATA_PROCESSING,
    'array': ComponentCategory.DATA_PROCESSING,
    'object': ComponentCategory.DATA_PROCESSING,
    'json': ComponentCategory.DATA_PROCESSING,
    'transform': ComponentCategory.DATA_PROCESSING,
    'format': ComponentCategory.DATA_PROCESSING,
    
    // Input/Output
    'input': ComponentCategory.INPUT_OUTPUT,
    'output': ComponentCategory.INPUT_OUTPUT,
    'file': ComponentCategory.INPUT_OUTPUT,
    'api': ComponentCategory.INPUT_OUTPUT,
    'http': ComponentCategory.INPUT_OUTPUT,
    'request': ComponentCategory.INPUT_OUTPUT,
    
    // Media
    'image': ComponentCategory.MEDIA,
    'audio': ComponentCategory.MEDIA,
    'video': ComponentCategory.MEDIA,
    'media': ComponentCategory.MEDIA,
    
    // Variables
    'variable': ComponentCategory.VARIABLES,
    'var': ComponentCategory.VARIABLES,
    'store': ComponentCategory.VARIABLES,
    'memory': ComponentCategory.VARIABLES,
    'context': ComponentCategory.VARIABLES
  };

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

            // If the component doesn't have metadata, try to infer it
            if (!ComponentClass.metadata) {
              ComponentClass.metadata = this.inferMetadata(type, componentName);
            }

            // Register the component
            this.registerNodeType(type, ComponentClass);
            console.log(`Dynamically registered component: ${componentName} as type "${type}"`);
            
            if (ComponentClass.metadata) {
              console.log(`Component metadata: ${JSON.stringify(ComponentClass.metadata)}`);
            }
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
  
  /**
   * Infer metadata for a component based on its name
   */
  private static inferMetadata(type: string, componentName: string): NodeComponent['metadata'] {
    // Try to auto-categorize the component based on its type
    let category: ComponentCategory | string = ComponentCategory.OTHER;
    
    // Check if the type directly maps to a category
    if (type in this.typeCategories) {
      category = this.typeCategories[type];
    } else {
      // Try to infer category from substring matches
      for (const [keyword, matchCategory] of Object.entries(this.typeCategories)) {
        if (type.includes(keyword)) {
          category = matchCategory;
          break;
        }
      }
    }
    
    // Infer flow type based on category
    // Data processing components are typically data flow nodes
    const flowType = category === ComponentCategory.DATA_PROCESSING ? 'data' : 'flow';
    
    // Format the name nicely
    const name = componentName.replace(/Node$/, '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    return {
      name,
      category,
      flowType: flowType as 'flow' | 'data'
    };
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

  static getRegisteredTypes(): Array<{ type: string, name: string, category: string, flowType?: string }> {
    // Dynamically generate the list based on registered components
    return Object.entries(this.nodeTypes).map(([type, Component]) => {
      // Try to get metadata from component if it has static metadata
      const metadata = Component.metadata || {};

      // Default values for component metadata
      const name = metadata.name || type.charAt(0).toUpperCase() + type.slice(1);
      const category = metadata.category || ComponentCategory.OTHER;
      const flowType = metadata.flowType || 'flow';

      return { type, name, category: String(category), flowType };
    });
  }

  static getNodeTypes(): string[] {
    return Object.keys(this.nodeTypes);
  }
}

// Export all components
export const Components = {
  StartNode,
  MessageNode,
  OptionsNode,
  ConditionNode,
  InputNode,
  MathNode
};

// Initialize component discovery
NodeFactory.discoverComponents().catch(err => {
  console.error('Failed to discover components:', err);
});