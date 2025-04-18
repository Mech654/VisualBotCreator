import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface TextNodeProperties extends NodeProperties {
    text: string;
    fontSize?: number;
    bold?: boolean;
    color?: string;
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

    constructor(id: string, properties: TextNodeProperties = { text: 'Sample text' }) {
        // Set default values
        properties.text = properties.text || 'Sample text';
        properties.fontSize = properties.fontSize || 16;
        properties.bold = properties.bold || false;
        properties.color = properties.color || '#000000';

        super(id, 'text', properties);

        // Add ports
        this.addInput(new Port('previous', 'Previous', 'control'));
        this.addOutput(new Port('next', 'Next', 'control'));

        // Add data ports
        this.addInput(new Port('textInput', 'Text Input', 'string'));
        this.addOutput(new Port('textOutput', 'Text Output', 'string'));
        this.addOutput(new Port('length', 'Length', 'number'));
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