import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface TextNodeProperties extends NodeProperties {
    text: string;
    fontSize?: number;
    bold?: boolean;
    color?: string;
    nodeContent?: string; // Add nodeContent property
}

export class TextNode extends Node {
    // Update to use ComponentCategory enum
    static metadata = {
        name: 'Text',
        category: ComponentCategory.DATA_PROCESSING,
        description: 'Process and format text content',
        flowType: 'data',
        icon: '📄'
    };

    constructor(id: string, properties: Partial<TextNodeProperties> = {}) {
        // Set default values
        const textNodeProps: TextNodeProperties = {
            text: properties.text || 'Sample text',
            fontSize: properties.fontSize || 16,
            bold: properties.bold || false,
            color: properties.color || '#000000'
        };
        
        // Generate the node content
        textNodeProps.nodeContent = generateTextNodePreview(textNodeProps);

        super(id, 'text', textNodeProps);

        // Add ports
        this.addInput(new Port('previous', 'Previous', 'control'));
        this.addOutput(new Port('next', 'Next', 'control'));

        // Add data ports
        this.addInput(new Port('textInput', 'Text Input', 'string'));
        this.addOutput(new Port('textOutput', 'Text Output', 'string'));
        this.addOutput(new Port('length', 'Length', 'number'));
    }
    
    /**
     * Update the node content when text or formatting changes
     */
    updateNodeContent() {
        // Cast the properties to TextNodeProperties to ensure it has the required 'text' property
        const textProps = this.properties as TextNodeProperties;
        this.properties.nodeContent = generateTextNodePreview(textProps);
        return this.properties.nodeContent;
    }
    
    /**
     * Generate the HTML for the text node's properties panel
     */
    generatePropertiesPanel(): string {
        return `
            <div class="property-group-title">Text Content</div>
            <div class="property-item" data-tooltip="The text content to output">
                <div class="property-label">Text</div>
                <textarea class="property-input text-content" rows="3">${this.properties.text || ''}</textarea>
            </div>
            <div class="property-item" data-tooltip="Font size in pixels">
                <div class="property-label">Font Size</div>
                <input type="number" class="property-input text-font-size" min="8" max="36" value="${this.properties.fontSize || 16}">
            </div>
            <div class="property-item" data-tooltip="Make text bold">
                <div class="property-label">Bold</div>
                <label class="switch">
                    <input type="checkbox" class="text-bold" ${this.properties.bold ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            <div class="property-item" data-tooltip="Text color">
                <div class="property-label">Color</div>
                <input type="color" class="property-input text-color" value="${this.properties.color || '#000000'}">
            </div>
        `;
    }
    
    /**
     * Set up event listeners for the text node property panel
     */
    setupPropertyEventListeners(panel: HTMLElement): void {
        const textInput = panel.querySelector('.text-content') as HTMLTextAreaElement;
        const fontSizeInput = panel.querySelector('.text-font-size') as HTMLInputElement;
        const boldCheckbox = panel.querySelector('.text-bold') as HTMLInputElement;
        const colorInput = panel.querySelector('.text-color') as HTMLInputElement;
        
        if (textInput) {
            textInput.addEventListener('change', () => {
                this.properties.text = textInput.value;
                this.updateNodeContent();
            });
        }
        
        if (fontSizeInput) {
            fontSizeInput.addEventListener('change', () => {
                this.properties.fontSize = Number(fontSizeInput.value);
                this.updateNodeContent();
            });
        }
        
        if (boldCheckbox) {
            boldCheckbox.addEventListener('change', () => {
                this.properties.bold = boldCheckbox.checked;
                this.updateNodeContent();
            });
        }
        
        if (colorInput) {
            colorInput.addEventListener('change', () => {
                this.properties.color = colorInput.value;
                this.updateNodeContent();
            });
        }
    }

    process(inputValues: Record<string, any>): Record<string, any> {
        // Use input text if provided, otherwise use the default text property
        const text = inputValues['textInput'] || this.properties.text;

        // Apply text transformations
        let processedText = text;
        if (this.properties.bold) {
            processedText = `<strong>${processedText}</strong>`;
        }

        return {
            textOutput: processedText,
            length: processedText.length
        };
    }
}

/**
 * Helper function to generate the node content for a text node
 */
function generateTextNodePreview(properties: TextNodeProperties): string {
    const text = properties.text || 'Sample text';
    const fontSize = properties.fontSize || 16;
    const bold = properties.bold || false;
    const color = properties.color || '#000000';
    
    // Truncate text if too long
    let displayText = text;
    if (displayText.length > 50) {
        displayText = displayText.substring(0, 47) + '...';
    }
    
    // Escape HTML
    displayText = displayText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    // Apply styling
    return `
        <div class="text-node-preview" style="
            font-size: ${fontSize}px;
            font-weight: ${bold ? 'bold' : 'normal'};
            color: ${color};">
            ${displayText}
        </div>
    `;
}