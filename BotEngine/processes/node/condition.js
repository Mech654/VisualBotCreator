import { BaseProcessor } from './BaseProcessor.js';

class ConditionProcessor extends BaseProcessor {
  process(executionData) {
    try {
      const properties = executionData.properties || {};
      const runtimeInputs = executionData.runtimeInputs || {};
      const conditionString = this.getProperty(properties, 'condition', 'value == true').trim();
      const valueToCheck = runtimeInputs.value;
      let result = false;
      let resultPath = 'false';
      try {
        // Sort operators by length (longest first) to avoid partial matches
        const operators = ['===', '!==', '>=', '<=', '==', '!=', '>', '<', '='];
        const sortedOperators = operators.sort((a, b) => b.length - a.length);
        const op = sortedOperators.find(o => conditionString.includes(o));
        if (!op) throw new Error('Invalid operator in: ' + conditionString);
        const [lhs, ...rhsParts] = conditionString.split(op);
        const rawValue = rhsParts.join(op).trim();
        let expected;
        if (rawValue === 'true') {
          expected = true;
        } else if (rawValue === 'false') {
          expected = false;
        } else if (/^-?\d+(?:\.\d+)?$/.test(rawValue)) {
          expected = parseFloat(rawValue);
        } else if ((rawValue.startsWith('"') && rawValue.endsWith('"')) || (rawValue.startsWith("'") && rawValue.endsWith("'"))) {
          expected = rawValue.slice(1, -1).trim();
        } else {
          expected = rawValue.trim();
        }
        if (['===', '==', '='].includes(op)) {
          if (typeof expected === 'string') {
            result = String(valueToCheck).trim() === expected;
          } else {
            result = valueToCheck === expected;
          }
        } else if (['!==', '!='].includes(op)) {
          if (typeof expected === 'string') {
            result = String(valueToCheck).trim() !== expected;
          } else {
            result = valueToCheck !== expected;
          }
        } else if (op === '>=') {
          result = parseFloat(valueToCheck) >= expected;
        } else if (op === '<=') {
          result = parseFloat(valueToCheck) <= expected;
        } else if (op === '>') {
          result = parseFloat(valueToCheck) > expected;
        } else if (op === '<') {
          result = parseFloat(valueToCheck) < expected;
        }
        resultPath = result ? 'true' : 'false';
      } catch (e) {
        result = false;
        resultPath = 'false';
      }
      let nextNodeId = null;
      if (executionData.outputs) {
        const port = executionData.outputs.find(o => o.id === resultPath);
        if (port && port.connectedTo && port.connectedTo.length) {
          nextNodeId = port.connectedTo[0].toNodeId;
        }
      }
      const responseData = {
        output: `Condition "${conditionString}" evaluated to: ${result}`,
        result,
        resultPath,
        exitCode: 0,
        status: true,
      };
      if (nextNodeId) responseData.NextNodeId = nextNodeId;
      return responseData;
    } catch (error) {
      return {
        output: `Error processing condition: ${error.message}`,
        result: false,
        resultPath: 'false',
        exitCode: 1,
        status: false,
      };
    }
  }
}

new ConditionProcessor();
