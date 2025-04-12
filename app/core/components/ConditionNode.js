const { Node, Port } = require('../base');

class ConditionNode extends Node {
  constructor(id, properties = {}) {
    properties.title = properties.title || 'Condition';
    properties.condition = properties.condition || 'value == true';
    
    super(id, 'condition', properties);
    
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addInput(new Port('value', 'Value to Check', 'any'));
    this.addOutput(new Port('true', 'True', 'control'));
    this.addOutput(new Port('false', 'False', 'control'));
    this.addOutput(new Port('result', 'Result', 'boolean'));
  }
  
  process(inputValues) {
    console.log(`Processing condition node ${this.id}: ${this.properties.condition}`);
    
    let result = false;
    
    try {
      const valueToCheck = inputValues['value'];
      
      if (this.properties.condition === 'value == true') {
        result = valueToCheck === true;
      } else if (this.properties.condition === 'value == false') {
        result = valueToCheck === false;
      } else if (this.properties.condition.includes('>')) {
        const threshold = parseFloat(this.properties.condition.split('>')[1].trim());
        result = parseFloat(valueToCheck) > threshold;
      } else if (this.properties.condition.includes('<')) {
        const threshold = parseFloat(this.properties.condition.split('<')[1].trim());
        result = parseFloat(valueToCheck) < threshold;
      } else {
        console.log(`Evaluating condition against value: ${valueToCheck}`);
        const condition = this.properties.condition.replace(/value/g, JSON.stringify(valueToCheck));
        result = eval(condition);
      }
    } catch (error) {
      console.error(`Error evaluating condition in node ${this.id}:`, error);
      result = false;
    }
    
    console.log(`Condition result: ${result}`);
    
    return { result };
  }
}

module.exports = ConditionNode;