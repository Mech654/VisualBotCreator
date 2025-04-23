import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface Option {
  text: string;
  value: string;
}

export interface OptionsNodeProperties extends NodeProperties {
  title?: string;
  options?: Option[];
  nodeContent?: string; // Add nodeContent property
}

export class OptionsNode extends Node {
  // Update to use ComponentCategory enum
  static metadata = {
    name: 'Options',
    category: ComponentCategory.CONVERSATION_FLOW,
    description: 'Present options to the user',
    flowType: 'flow',
    icon: '📋'
  };

  constructor(id: string, properties: OptionsNodeProperties = {}) {
    properties.title = properties.title || 'Options';

    properties.options = properties.options || [
      { text: 'Option 1', value: 'option1' },
      { text: 'Option 2', value: 'option2' },
      { text: 'Option 3', value: 'option3' }
    ];
    
    // Generate the node content for display without using 'this'
    properties.nodeContent = generateOptionsPreview(properties.options);

    super(id, 'options', properties);

    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));

    properties.options.forEach((option: Option, index: number) => {
      this.addOutput(new Port(`option${index + 1}`, option.text, 'control'));
    });

    this.addOutput(new Port('selectedOption', 'Selected Option', 'string'));
  }

  /**
   * Update the node content when options change
   */
  updateNodeContent() {
    this.properties.nodeContent = generateOptionsPreview(this.properties.options || []);
    return this.properties.nodeContent;
  }
  
  /**
   * Generate the HTML for the options node's properties panel
   */
  generatePropertiesPanel(): string {
    const options = this.properties.options || [];
    let optionsHtml = '';
    
    options.forEach((option: Option, index: number) => {
      optionsHtml += `
        <div class="option-row" data-index="${index}">
          <input type="text" class="property-input option-text" 
                 value="${option.text}" placeholder="Option text">
          <input type="text" class="property-input option-value" 
                 value="${option.value}" placeholder="Value">
          <button class="btn-remove-option">✕</button>
        </div>
      `;
    });
    
    return `
      <div class="property-group-title">Options</div>
      <div class="property-item" data-tooltip="Configure the options to present to the user">
        <div class="options-container">
          ${optionsHtml}
        </div>
        <button class="btn btn-outline add-option" style="margin-top: 10px;">
          <span class="btn-icon">+</span> Add Option
        </button>
      </div>
    `;
  }
  
  /**
   * Set up event listeners for the options node property panel
   */
  setupPropertyEventListeners(panel: HTMLElement): void {
    const optionsContainer = panel.querySelector('.options-container');
    const addOptionBtn = panel.querySelector('.add-option');
    
    if (optionsContainer && addOptionBtn) {
      // Add new option
      addOptionBtn.addEventListener('click', () => {
        const newIndex = (this.properties.options || []).length;
        const newOption = { text: `Option ${newIndex + 1}`, value: `option${newIndex + 1}` };
        
        if (!this.properties.options) {
          this.properties.options = [];
        }
        
        this.properties.options.push(newOption);
        
        // Add new option row to the UI
        const newRow = document.createElement('div');
        newRow.className = 'option-row';
        newRow.dataset.index = String(newIndex);
        newRow.innerHTML = `
          <input type="text" class="property-input option-text" 
                 value="${newOption.text}" placeholder="Option text">
          <input type="text" class="property-input option-value" 
                 value="${newOption.value}" placeholder="Value">
          <button class="btn-remove-option">✕</button>
        `;
        
        optionsContainer.appendChild(newRow);
        this.setupOptionRowEvents(newRow);
        
        // Update the node content
        this.updateNodeContent();
      });
      
      // Setup events for existing option rows
      panel.querySelectorAll('.option-row').forEach(row => {
        this.setupOptionRowEvents(row as HTMLElement);
      });
    }
  }
  
  /**
   * Set up events for individual option rows
   */
  setupOptionRowEvents(row: HTMLElement): void {
    const textInput = row.querySelector('.option-text') as HTMLInputElement;
    const valueInput = row.querySelector('.option-value') as HTMLInputElement;
    const removeBtn = row.querySelector('.btn-remove-option') as HTMLButtonElement;
    const index = parseInt(row.dataset.index || '0', 10);
    
    if (textInput && valueInput && removeBtn && !isNaN(index)) {
      // Update option text
      textInput.addEventListener('change', () => {
        if (this.properties.options && this.properties.options[index]) {
          this.properties.options[index].text = textInput.value;
          this.updateNodeContent();
        }
      });
      
      // Update option value
      valueInput.addEventListener('change', () => {
        if (this.properties.options && this.properties.options[index]) {
          this.properties.options[index].value = valueInput.value;
        }
      });
      
      // Remove option
      removeBtn.addEventListener('click', () => {
        if (this.properties.options && this.properties.options.length > 1) {
          this.properties.options.splice(index, 1);
          row.remove();
          
          // Reindex remaining rows
          const rows = document.querySelectorAll('.option-row');
          rows.forEach((row, i) => {
            (row as HTMLElement).dataset.index = String(i);
          });
          
          this.updateNodeContent();
        }
      });
    }
  }
  
  process(inputValues: Record<string, any>, selectedOptionIndex: number | null = null): Record<string, any> {
    if (selectedOptionIndex !== null &&
      selectedOptionIndex >= 0 &&
      selectedOptionIndex < this.properties.options.length) {

      const selectedOption = this.properties.options[selectedOptionIndex];

      return {
        selectedOption: selectedOption.value
      };
    }

    return {};
  }

  getOptionTexts(): string[] {
    return (this.properties.options as Option[]).map(option => option.text);
  }
}

/**
 * Helper function to generate options preview HTML
 */
function generateOptionsPreview(options: Option[]): string {
  if (!options || options.length === 0) {
    return '<div class="options-empty">No options defined</div>';
  }
  
  // Limit to first 3 options for preview, with indicator if there are more
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