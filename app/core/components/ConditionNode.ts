import { Node, Port, NodeProperties } from '../base.js';

export interface ConditionNodeProperties extends NodeProperties {
  title?: string;
  condition?: string;
}

export class ConditionNode extends Node {
  constructor(id: string, properties: ConditionNodeProperties = {}) {
    properties.title = properties.title || 'Condition';
    properties.condition = properties.condition || 'value == true';
    
    super(id, 'condition', properties);
    
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addInput(new Port('value', 'Value to Check', 'any'));
    this.addOutput(new Port('true', 'True', 'control'));
    this.addOutput(new Port('false', 'False', 'control'));
    this.addOutput(new Port('result', 'Result', 'boolean'));
  }
  
  process(inputValues: Record<string, any>): Record<string, any> {
    let result = false;
    
    try {
      const valueToCheck = inputValues['value'];
      const conditionString = this.properties.condition as string;
      
      // Safer condition evaluation without eval
      if (conditionString === 'value == true') {
        result = valueToCheck === true;
      } else if (conditionString === 'value == false') {
        result = valueToCheck === false;
      } else if (conditionString.includes('==')) {
        const parts = conditionString.split('==').map(part => part.trim());
        if (parts[0] === 'value') {
          result = valueToCheck == parts[1];
        }
      } else if (conditionString.includes('>')) {
        const threshold = parseFloat(conditionString.split('>')[1].trim());
        result = parseFloat(String(valueToCheck)) > threshold;
      } else if (conditionString.includes('<')) {
        const threshold = parseFloat(conditionString.split('<')[1].trim());
        result = parseFloat(String(valueToCheck)) < threshold;
      } else if (conditionString.includes('!=')) {
        const parts = conditionString.split('!=').map(part => part.trim());
        if (parts[0] === 'value') {
          result = valueToCheck != parts[1];
        }
      } else {
        result = Boolean(valueToCheck);
      }
    } catch (error) {
      result = false;
    }
    
    return { result };
  }
}