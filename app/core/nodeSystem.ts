import { Node, Port, Connection } from './base.js';

export interface NodeComponent {
  new (id: string, properties?: Record<string, any>): Node;
}

export class NodeFactory {
  private static nodeTypes: Record<string, NodeComponent> = {};

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
    return [
      { type: 'start', name: 'Start', category: 'Conversation Flow' },
      { type: 'message', name: 'Message', category: 'Conversation Flow' },
      { type: 'options', name: 'Options', category: 'Conversation Flow' },
      { type: 'input', name: 'User Input', category: 'Conversation Flow' },
      { type: 'condition', name: 'Condition', category: 'Logic' },
      { type: 'math', name: 'Math', category: 'Logic' }
    ];
  }
}

export { Node, Port, Connection };

// We'll register the node components after they're imported
import { StartNode } from './components/StartNode.js';
import { MessageNode } from './components/MessageNode.js';
import { OptionsNode } from './components/OptionsNode.js';
import { ConditionNode } from './components/ConditionNode.js';
import { InputNode } from './components/InputNode.js';
import { MathNode } from './components/MathNode.js';

// Register all node types
NodeFactory.registerNodeType('start', StartNode as unknown as NodeComponent);
NodeFactory.registerNodeType('message', MessageNode as unknown as NodeComponent);
NodeFactory.registerNodeType('options', OptionsNode as unknown as NodeComponent);
NodeFactory.registerNodeType('condition', ConditionNode as unknown as NodeComponent);
NodeFactory.registerNodeType('input', InputNode as unknown as NodeComponent);
NodeFactory.registerNodeType('math', MathNode as unknown as NodeComponent);

// Export all components
export const Components = {
  StartNode,
  MessageNode,
  OptionsNode,
  ConditionNode,
  InputNode,
  MathNode
};