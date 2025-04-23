import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface IncrementNodeProperties extends NodeProperties {
    incrementBy?: number;
}

export class IncrementNode extends Node {
    static metadata = {
        name: 'Increment',
        category: ComponentCategory.DATA_PROCESSING,
        description: 'Takes a number and increments it',
        flowType: 'data',
        icon: '➕'
    };

    constructor(id: string, properties: IncrementNodeProperties = {}) {
        // Set default increment value to 1 if not provided
        properties.incrementBy = properties.incrementBy || 1;
        properties.title = properties.title || 'Increment';

        super(id, 'increment', properties);

        // Add flow control ports
        this.addInput(new Port('previous', 'Previous', 'control'));
        this.addOutput(new Port('next', 'Next', 'control'));

        // Add data ports
        this.addInput(new Port('number', 'Number', 'number'));
        this.addOutput(new Port('result', 'Result', 'number'));
    }

    process(inputValues: Record<string, any>): Record<string, any> {
        // Get the input number or default to 0
        const inputNumber = typeof inputValues['number'] === 'number' ? inputValues['number'] : 0;

        // Get the increment amount from properties
        const incrementBy = this.properties.incrementBy || 1;

        // Calculate the result
        const result = inputNumber + incrementBy;

        // Return the incremented number
        return {
            result: result
        };
    }
}