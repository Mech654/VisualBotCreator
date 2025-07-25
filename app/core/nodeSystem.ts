import { Node, Port, Connection } from './base.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export enum ComponentCategory {
  FLOW = 'Flow',
  DATA = 'Data',
  VARIABLE = 'Variable',
}

export interface NodeComponent {
  new (id: string, properties?: any, position?: { x: number; y: number }): Node;
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

  static async discoverComponents(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const files = fs
        .readdirSync(this.componentsDir)
        .filter(file => file.endsWith('.js') && !file.includes('index.js'));

      console.log(`Found ${files.length} component files:`, files);

      for (const file of files) {
        try {
          const componentName = file.replace('.js', '');

          // Skip if we've already registered this component
          if (this.renameWithoutType(componentName) in this.nodeTypes) {
            continue;
          }

          const componentModule = await import(`./components/${file}`);

          const ComponentClass = componentModule[componentName];

          if (ComponentClass && typeof ComponentClass === 'function') {
            const type = this.renameWithoutType(componentName);

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
   * CalculaterNode --> calculater
   */
  private static renameWithoutType(componentName: string): string {
    return componentName.replace(/Node$/, '').toLowerCase();
  }

  static registerNodeType(type: string, componentClass: NodeComponent): void {
    this.nodeTypes[type] = componentClass;
  }

  static createNode(
    type: string,
    id: string,
    properties: Record<string, any> = {},
    position: { x: number; y: number } = { x: 0, y: 0 }
  ): Node {
    console.log(`Creating node of type: ${type}, available types:`, Object.keys(this.nodeTypes));

    const NodeClass = this.nodeTypes[type];

    if (!NodeClass) {
      throw new Error(`Unknown node type: ${type}`);
    }

    return new NodeClass(id, properties, position);
  }

  static getRegisteredTypes(): Array<{
    type: string;
    name: string;
    category: string;
    flowType?: string;
  }> {
    const registeredComponents = Object.entries(this.nodeTypes).map(([type, Component]) => {
      const metadata = Component.metadata || {};

      const name = metadata.name || type.charAt(0).toUpperCase() + type.slice(1);
      let category = metadata.category;
      
      const flowType = metadata.flowType || 'flow';

      return { type, name, category: String(category), flowType };
    });
    console.log(`Backend side sending ${registeredComponents.length} components`); // useful for when you just added a new component
    return registeredComponents;
  }

  static getNodeTypes(): string[] {
    return Object.keys(this.nodeTypes);
  }
}

export { Node, Port, Connection };

NodeFactory.discoverComponents().catch(err => {
  console.error('Failed to discover components:', err);
});
