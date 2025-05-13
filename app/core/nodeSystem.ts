import { Node, Port, Connection } from './base.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module compatible approach to get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define component categories for organization
export enum ComponentCategory {
  CONVERSATION_FLOW = 'Conversation Flow',
  LOGIC = 'Logic',
  DATA_PROCESSING = 'Data Processing',
  INPUT_OUTPUT = 'Input/Output',
  MEDIA = 'Media',
  VARIABLES = 'Variables',
  OTHER = 'Other',
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

export class NodeFactory {
  private static nodeTypes: Record<string, NodeComponent> = {};
  private static componentsDir = path.join(__dirname, 'components');
  private static isInitialized = false;

  /**
   * Map of keywords to categories - used for auto-categorization of new components
   */
  private static typeCategoryKeywords: Record<string, ComponentCategory> = {
    // Conversation Flow
    start: ComponentCategory.CONVERSATION_FLOW,
    message: ComponentCategory.CONVERSATION_FLOW,
    options: ComponentCategory.CONVERSATION_FLOW,
    dialog: ComponentCategory.CONVERSATION_FLOW,
    chat: ComponentCategory.CONVERSATION_FLOW,

    // Logic
    condition: ComponentCategory.LOGIC,
    if: ComponentCategory.LOGIC,
    switch: ComponentCategory.LOGIC,
    branch: ComponentCategory.LOGIC,
    logic: ComponentCategory.LOGIC,

    // Data Processing
    math: ComponentCategory.DATA_PROCESSING,
    data: ComponentCategory.DATA_PROCESSING,
    text: ComponentCategory.DATA_PROCESSING,
    string: ComponentCategory.DATA_PROCESSING,
    number: ComponentCategory.DATA_PROCESSING,

    // Input/Output
    input: ComponentCategory.INPUT_OUTPUT,
    output: ComponentCategory.INPUT_OUTPUT,
    file: ComponentCategory.INPUT_OUTPUT,
    api: ComponentCategory.INPUT_OUTPUT,

    // Media
    image: ComponentCategory.MEDIA,
    audio: ComponentCategory.MEDIA,
    video: ComponentCategory.MEDIA,
    media: ComponentCategory.MEDIA,

    // Variables
    variable: ComponentCategory.VARIABLES,
    var: ComponentCategory.VARIABLES,
    store: ComponentCategory.VARIABLES,
  };

  /**
   * Dynamically discover and load all components from the components directory
   */
  static async discoverComponents(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get all JavaScript files in the components directory (after compilation)
      const files = fs
        .readdirSync(this.componentsDir)
        .filter(file => file.endsWith('.js') && !file.includes('index.js'));

      console.log(`Found ${files.length} component files:`, files);

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
          }
        } catch (err) {
          console.error(`Error loading component ${file}:`, err);
        }
      }

      this.isInitialized = true;
    } catch (err) {
      console.error('Error discovering components:', err);
    }
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
    let category: ComponentCategory = ComponentCategory.OTHER;

    // Check each keyword for category matching
    for (const [keyword, matchCategory] of Object.entries(this.typeCategoryKeywords)) {
      if (type.includes(keyword)) {
        category = matchCategory;
        break;
      }
    }

    // Infer flow type based on category
    const flowType =
      category === ComponentCategory.DATA_PROCESSING ||
      type.includes('data') ||
      type.includes('math') ||
      type.includes('number') ||
      type.includes('string')
        ? 'data'
        : 'flow';

    // Format the name nicely
    const name = componentName
      .replace(/Node$/, '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();

    return {
      name,
      category,
      description: `${name} component`,
      flowType: flowType,
    };
  }

  static registerNodeType(type: string, componentClass: NodeComponent): void {
    this.nodeTypes[type] = componentClass;
  }

  static createNode(type: string, id: string, properties: Record<string, any> = {}): Node {
    console.log(`Creating node of type: ${type}, available types:`, Object.keys(this.nodeTypes));

    const NodeClass = this.nodeTypes[type];

    if (!NodeClass) {
      throw new Error(`Unknown node type: ${type}`);
    }

    return new NodeClass(id, properties);
  }

  static getRegisteredTypes(): Array<{
    type: string;
    name: string;
    category: string;
    flowType?: string;
  }> {
    // Dynamically generate the list based on registered components
    const registeredComponents = Object.entries(this.nodeTypes).map(([type, Component]) => {
      // Try to get metadata from component if it has static metadata
      const metadata = Component.metadata || {};

      // Default values for component metadata
      const name = metadata.name || type.charAt(0).toUpperCase() + type.slice(1);
      const category = metadata.category || ComponentCategory.OTHER;
      const flowType = metadata.flowType || 'flow';

      return { type, name, category: String(category), flowType };
    });
    console.log(`Backend side sending ${registeredComponents.length} components`);
    return registeredComponents;
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
