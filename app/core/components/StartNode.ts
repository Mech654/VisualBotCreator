import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface StartNodeProperties extends NodeProperties {
  nodeContent?: string;
  language?: string;
}

export class StartNode extends Node {
  static metadata = {
    name: 'Start',
    category: ComponentCategory.FLOW,
    description: 'Start node',
    flowType: 'flow',
    icon: '🚀',
  };

  static override shownProperties = [];

  constructor(id: string, properties: StartNodeProperties = {}) {
    properties.title = typeof properties.title === 'string' ? properties.title : 'Start';
    properties.nodeContent = 'Bot conversation starts here';
    properties.language =
      typeof properties.language === 'string' && properties.language.trim() !== ''
        ? properties.language
        : 'JavaScript';
    super(id, 'start', properties);
    this.addOutput(new Port('next', 'Next', 'control', 'next'));
  }

  updateNodeContent(): string {
    this.properties.nodeContent = 'Bot conversation starts here';
    return this.properties.nodeContent as string;
  }
}
