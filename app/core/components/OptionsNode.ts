import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface Option {
  text: string;
  value: string;
}

export interface OptionsNodeProperties extends NodeProperties {
  title?: string;
  options?: Option[];
  nodeContent?: string;
}

export class OptionsNode extends Node {
  static metadata = {
    name: 'Options',
    category: ComponentCategory.FLOW,
    description: 'Options node',
    flowType: 'flow',
    icon: '📋',
  };

  static override shownProperties = ['options'];

  constructor(id: string, properties: OptionsNodeProperties = {}) {
    properties.title = properties.title || 'Options';
    properties.options = properties.options || [
      { text: 'Option 1', value: 'option1' },
      { text: 'Option 2', value: 'option2' },
      { text: 'Option 3', value: 'option3' },
    ];
    properties.nodeContent = generateOptionsPreview(properties.options);
    super(id, 'options', properties);
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));
    properties.options.forEach((option: Option, index: number) => {
      this.addOutput(new Port(`option${index + 1}`, option.text, 'control'));
    });
    this.addOutput(new Port('selectedOption', 'Selected Option', 'string'));
  }

  updateNodeContent() {
    this.properties.nodeContent = generateOptionsPreview(this.properties.options || []);
    return this.properties.nodeContent;
  }

  process(
    inputValues: Record<string, any>,
    selectedOptionIndex: number | null = null
  ): Record<string, any> {
    if (
      selectedOptionIndex !== null &&
      selectedOptionIndex >= 0 &&
      selectedOptionIndex < this.properties.options.length
    ) {
      const selectedOption = this.properties.options[selectedOptionIndex];
      return {
        selectedOption: selectedOption.value,
      };
    }
    return {};
  }

  getOptionTexts(): string[] {
    return (this.properties.options as Option[]).map(option => option.text);
  }
}

function generateOptionsPreview(options: Option[]): string {
  if (!options || options.length === 0) {
    return '<div class="options-empty">No options defined</div>';
  }
  const displayOptions = options.slice(0, 3);
  const hasMore = options.length > 3;
  let html = '<div class="options-list">';
  displayOptions.forEach(option => {
    html += `<div class="option-item">${option.text}</div>`;
  });
  if (hasMore) {
    html += `<div class="option-more">+${options.length - 3} more...</div>`;
  }
  html += '</div>';
  return html;
}
