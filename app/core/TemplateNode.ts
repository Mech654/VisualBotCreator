import { Node, Port, NodeProperties } from './base.js';
import { ComponentCategory } from './nodeSystem.js';

export interface TemplateNodeProperties extends NodeProperties {
  nodeContent?: string;
  language?: string;
  // exampleProperty?: string;
}

export class TemplateNode extends Node {
  static metadata = {
    name: 'Template',
    category: ComponentCategory.FLOW,
    description: 'Minimal node template.',
    flowType: 'data',
    icon: '📄',
  };

  static override shownProperties: string[] = [];

  constructor(id: string, properties: TemplateNodeProperties = {}) {
    properties.title = properties.title || 'Template Node';
    properties.language = properties.language || 'JavaScript';
    properties.nodeContent =
      properties.nodeContent || '<div class="template-node-content">Template</div>';
    super(id, 'template', properties);
    // this.addInput(new Port('input', 'Input', 'string'));
    // this.addOutput(new Port('output', 'Output', 'string'));
  }

  updateNodeContent() {
    return this.properties.nodeContent;
  }

  generatePropertiesPanel(): string {
    return '<div class="property-group-title">Settings</div><p>No properties.</p>';
  }

  setupPropertyEventListeners(panel: HTMLElement): void {
    // Add event listeners if properties panel has interactive elements
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    return {};
  }
}
