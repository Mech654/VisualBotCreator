import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface TextNodeProperties extends NodeProperties {
  text: string;
  fontSize?: number;
  bold?: boolean;
  color?: string;
  nodeContent?: string;
  title?: string;
  language?: string;
}

export class TextNode extends Node {
  static metadata = {
    name: 'Text',
    category: ComponentCategory.DATA,
    description: 'Text node',
    flowType: 'data',
  };

  static override shownProperties = ['text', 'fontSize', 'bold', 'color'];

  constructor(id: string, properties: Partial<TextNodeProperties> = {}) {
    const textNodeProps: TextNodeProperties = {
      text: properties.text || 'Sample text',
      fontSize: properties.fontSize || 16,
      bold: properties.bold || false,
      color: properties.color || '#000000',
      language: properties.language || 'JavaScript',
    };
    textNodeProps.nodeContent = generateTextNodePreview(textNodeProps);
    super(id, 'text', textNodeProps);
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    this.addInput(new Port('textInput', 'Text Input', 'string', 'text'));
    this.addOutput(new Port('textOutput', 'Text Output', 'string', 'text'));
    this.addOutput(new Port('length', 'Length', 'number', 'text'));
  }

  updateNodeContent() {
    const textProps = this.properties as TextNodeProperties;
    this.properties.nodeContent = generateTextNodePreview(textProps);
    return this.properties.nodeContent;
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    const text = inputValues['textInput'] || this.properties.text;
    let processedText = text;
    if (this.properties.bold) {
      processedText = `<strong>${processedText}</strong>`;
    }
    return {
      textOutput: processedText,
      length: processedText.length,
    };
  }
}

function generateTextNodePreview(properties: TextNodeProperties): string {
  const text = properties.text || 'Sample text';
  const fontSize = properties.fontSize || 16;
  const bold = properties.bold || false;
  let displayText = text;
  if (displayText.length > 50) {
    displayText = displayText.substring(0, 47) + '...';
  }
  displayText = displayText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  return `
        <div class="text-node-preview" style="
            font-size: ${fontSize}px;
            font-weight: ${bold ? 'bold' : 'normal'};
            color: #FFFFFF;">
            ${displayText}
        </div>
  `;
}
