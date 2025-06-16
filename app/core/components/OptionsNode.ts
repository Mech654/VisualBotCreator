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
  language?: string;
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
    properties.title =
      typeof properties.title === 'string' && properties.title.trim() !== ''
        ? properties.title
        : 'Options';
    properties.language =
      typeof properties.language === 'string' && properties.language.trim() !== ''
        ? properties.language
        : 'JavaScript';
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
      this.addOutput(new Port(`option${index + 1}`, option.text, 'control', 'options'));
    });
    this.addOutput(new Port('selectedOption', 'Selected Option', 'string', 'options'));
  }

  updateNodeContent(): string {
    this.properties.nodeContent = generateOptionsPreview(
      Array.isArray(this.properties.options) ? (this.properties.options as Option[]) : []
    );
    return this.properties.nodeContent as string;
  }

  process(
    inputValues: Record<string, unknown>,
    selectedOptionIndex: number | null = null
  ): Record<string, unknown> {
    if (
      selectedOptionIndex !== null &&
      selectedOptionIndex >= 0 &&
      selectedOptionIndex < (this.properties.options as Option[]).length
    ) {
      const selectedOption = (this.properties.options as Option[])[selectedOptionIndex];
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
  if (options.length === 0) {
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
