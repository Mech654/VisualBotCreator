import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface RandomNodeProperties extends NodeProperties {
    min?: number;
    max?: number;
    type?: 'integer' | 'float' | 'boolean' | 'string';
    length?: number;
}

export class RandomNode extends Node {
    // Define metadata directly in the component class
    static metadata = {
        name: 'Random',
        category: ComponentCategory.DATA_PROCESSING,
        description: 'Generate random values of different types',
        flowType: 'data',
        icon: '🎲'
    };

    constructor(id: string, properties: RandomNodeProperties = {}) {
        // Set default values
        properties.min = properties.min ?? 1;
        properties.max = properties.max ?? 100;
        properties.type = properties.type || 'integer';
        properties.length = properties.length ?? 10;

        super(id, 'random', properties);

        // Add basic flow ports
        this.addInput(new Port('previous', 'Previous', 'control'));
        this.addOutput(new Port('next', 'Next', 'control'));

        // Add data input ports for configuration
        this.addInput(new Port('min', 'Minimum', 'number'));
        this.addInput(new Port('max', 'Maximum', 'number'));
        this.addInput(new Port('seed', 'Seed', 'number'));

        // Add appropriate output port based on type
        if (properties.type === 'boolean') {
            this.addOutput(new Port('value', 'Random Boolean', 'boolean'));
        } else if (properties.type === 'string') {
            this.addOutput(new Port('value', 'Random String', 'string'));
        } else {
            this.addOutput(new Port('value', 'Random Number', 'number'));
        }
    }

    process(inputValues: Record<string, any>): Record<string, any> {
        // Get configured values or use input values if provided
        const min = inputValues.min !== undefined ? Number(inputValues.min) : this.properties.min;
        const max = inputValues.max !== undefined ? Number(inputValues.max) : this.properties.max;
        const type = this.properties.type;
        const length = this.properties.length;

        // Generate random value based on type
        let value: any;

        switch (type) {
            case 'integer':
                value = Math.floor(Math.random() * (max - min + 1)) + min;
                break;

            case 'float':
                value = Math.random() * (max - min) + min;
                break;

            case 'boolean':
                value = Math.random() >= 0.5;
                break;

            case 'string':
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let result = '';
                for (let i = 0; i < length; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                value = result;
                break;

            default:
                value = Math.random() * (max - min) + min;
        }

        return { value };
    }
}