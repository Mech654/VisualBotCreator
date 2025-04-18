import { Node, Port, Connection } from './base.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module compatible approach to get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface NodeComponent {
  new (id: string, properties?: Record<string, any>): Node;
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
    
    try {
      // Get all TypeScript files in the components directory
      const files = fs.readdirSync(this.componentsDir)
        .filter(file => file.endsWith('.ts') && !file.includes('index.ts'));
      
      // Import each component dynamically
      for (const file of files) {
        try {
          const componentName = file.replace('.ts', '');
          const componentModule = await import(`./components/${file.replace('.ts', '.js')}`);
          
          // Get the component class from the module
          const ComponentClass = componentModule[componentName];
          
          if (ComponentClass && typeof ComponentClass === 'function') {
            // Extract the type from the component name (assuming it ends with "Node")
            const type = componentName.replace('Node', '').toLowerCase();
            
            // Register the component
            this.registerNodeType(type, ComponentClass);
            console.log(`Automatically registered component: ${componentName} as type "${type}"`);
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

  static registerNodeType(type: string, componentClass: NodeComponent): void {
    this.nodeTypes[type] = componentClass;
  }

  static createNode(type: string, id: string, properties: Record<string, any> = {}): Node {
    const NodeClass = this.nodeTypes[type];
    
    if (!NodeClass) {
      throw new Error(`Unknown node type: ${type}`);
    }
    
    return new NodeClass(id, properties);
  }
  
  static getRegisteredTypes(): Array<{ type: string, name: string, category: string }> {
    // Dynamically generate the list based on registered components
    return Object.entries(this.nodeTypes).map(([type, Component]) => {
      // Try to get metadata from component if it has static metadata
      const metadata = (Component as any).metadata || {};
      
      // Default values for component metadata
      const name = metadata.name || type.charAt(0).toUpperCase() + type.slice(1);
      const category = metadata.category || 'Components';
      
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
export const Components = {};