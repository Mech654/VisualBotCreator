import { NodeInstance } from '../models/types.js';
import { PortCategory, PortType } from '../../../core/base.js';

/**
 * Generates HTML for a node based on its instance data
 */
export function generateNodeHtml(nodeInstance: NodeInstance): string {
  const { type, properties, inputs, outputs } = nodeInstance;

  // Separate flow and data ports using the port category system
  const flowInputs = inputs.filter(input => isFlowPort(input.dataType));
  const dataInputs = inputs.filter(input => !isFlowPort(input.dataType));

  const flowOutputs = outputs.filter(output => isFlowPort(output.dataType));
  const dataOutputs = outputs.filter(output => !isFlowPort(output.dataType));

  // Get the main flow input port
  const mainInputPort = flowInputs.length > 0 ? flowInputs[0] : null;

  // Generate the flow ports HTML based on node type
  let flowPortsHtml = '';

  if (type === 'condition') {
    // Special handling for condition node with true/false ports
    const truePort = flowOutputs.find(p => p.id === 'true');
    const falsePort = flowOutputs.find(p => p.id === 'false');

    flowPortsHtml = `
      <div class="node-ports">
        ${mainInputPort ? `
          <div class="port-container input-port-container">
            <div class="${buildPortClassList(['port', 'input-port'], mainInputPort.dataType)}" 
                 data-port-id="${mainInputPort.id}" 
                 data-port-type="${mainInputPort.dataType}" 
                 data-port-category="${getPortCategory(mainInputPort.dataType)}"
                 title="${mainInputPort.label}">
            </div>
          </div>
        ` : ''}
        
        ${truePort ? `
          <div class="port-container output-port-container output-port-true">
            <div class="${buildPortClassList(['port', 'output-port'], truePort.dataType)}" 
                 data-port-id="${truePort.id}" 
                 data-port-type="${truePort.dataType}" 
                 data-port-category="${getPortCategory(truePort.dataType)}"
                 title="True">
            </div>
          </div>
        ` : ''}
        
        ${falsePort ? `
          <div class="port-container output-port-container output-port-false">
            <div class="${buildPortClassList(['port', 'output-port'], falsePort.dataType)}" 
                 data-port-id="${falsePort.id}" 
                 data-port-type="${falsePort.dataType}" 
                 data-port-category="${getPortCategory(falsePort.dataType)}"
                 title="False">
            </div>
          </div>
        ` : ''}
      </div>
    `;
  } else {
    // Standard behavior for other nodes
    const mainOutputPort = flowOutputs.length > 0 ? flowOutputs[0] : null;

    flowPortsHtml = `
      <div class="node-ports">
        ${mainInputPort ? `
          <div class="port-container input-port-container">
            <div class="${buildPortClassList(['port', 'input-port'], mainInputPort.dataType)}" 
                 data-port-id="${mainInputPort.id}" 
                 data-port-type="${mainInputPort.dataType}" 
                 data-port-category="${getPortCategory(mainInputPort.dataType)}"
                 title="${mainInputPort.label}">
            </div>
          </div>
        ` : ''}
        
        ${mainOutputPort ? `
          <div class="port-container output-port-container">
            <div class="${buildPortClassList(['port', 'output-port'], mainOutputPort.dataType)}" 
                 data-port-id="${mainOutputPort.id}" 
                 data-port-type="${mainOutputPort.dataType}" 
                 data-port-category="${getPortCategory(mainOutputPort.dataType)}"
                 title="${mainOutputPort.label}">
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Generate content based on node type using a more dynamic approach
  let content = '';

  // Use component-specific renderer if available, otherwise use generic approach
  switch (type) {
    case 'start':
      content = '<p>Bot conversation starts here.</p>';
      break;
    case 'message':
      content = `<p>${properties.message || 'Enter your message here...'}</p>`;
      break;
    case 'options':
      content = properties.options ? properties.options.map(opt =>
        `<div class="node-option">${opt.text}</div>`
      ).join('') : '';
      break;
    case 'input':
      content = `<p>${properties.placeholder || 'Waiting for user input...'}</p>`;
      break;
    case 'condition':
      content = `<p>if (${properties.condition}) { ... }</p>`;
      break;
    case 'math':
      content = `<p>Performing ${properties.expression || 'math'} operation</p>`;
      break;
    default:
      // Generic content renderer for any component
      content = generateGenericContent(type, properties);
      break;
  }

  // Generate data ports HTML
  const dataPortsHtml = dataInputs.length > 0 || dataOutputs.length > 0 ? `
    <div class="node-data-ports-container">
      <div class="data-input-ports">
        ${dataInputs.map(input => {
    return `
            <div class="data-port-container">
              <span class="port-label">${input.label}</span>
              <div class="${buildPortClassList(['port', 'input-port'], input.dataType)}" 
                   data-port-id="${input.id}" 
                   data-port-type="${input.dataType}" 
                   data-port-category="${getPortCategory(input.dataType)}"
                   title="${input.label}: ${input.dataType}">
              </div>
            </div>
          `;
  }).join('')}
      </div>
      <div class="data-output-ports">
        ${dataOutputs.map(output => {
    return `
            <div class="data-port-container">
              <div class="${buildPortClassList(['port', 'output-port'], output.dataType)}" 
                   data-port-id="${output.id}" 
                   data-port-type="${output.dataType}" 
                   data-port-category="${getPortCategory(output.dataType)}"
                   title="${output.label}: ${output.dataType}">
              </div>
              <span class="port-label">${output.label}</span>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  ` : '';

  // Add a data-flow-type attribute to the node div for styling
  const nodeFlowType = hasFlowPorts(inputs, outputs) ? 'flow' : 'data';

  // Return the complete node HTML with improved structure
  return `
    <div class="node-header">
      <span>${properties.title || type.charAt(0).toUpperCase() + type.slice(1)}</span>
      <span class="node-menu">⋮</span>
    </div>
    ${flowPortsHtml}
    <div class="node-content">
      ${content}
    </div>
    ${dataPortsHtml}
  `;
}

/**
 * Generate generic content for any component type
 */
function generateGenericContent(type: string, properties: any): string {
  // First, try to display the most important property if it exists
  const importantProps = ['value', 'text', 'data', 'content', 'expression', 'formula'];

  for (const prop of importantProps) {
    if (properties[prop] !== undefined) {
      return `<p>${properties[prop]}</p>`;
    }
  }

  // Display component type as fallback
  return `<p>${type.charAt(0).toUpperCase() + type.slice(1)} node</p>`;
}

/**
 * Check if a data type is a flow port
 */
function isFlowPort(dataType: string): boolean {
  return dataType === 'control' || dataType === 'flow';
}

/**
 * Check if node has flow ports
 */
function hasFlowPorts(inputs: Array<any>, outputs: Array<any>): boolean {
  return inputs.some(port => isFlowPort(port.dataType)) ||
    outputs.some(port => isFlowPort(port.dataType));
}

/**
 * Get the port category (flow or data) for a given data type
 */
function getPortCategory(dataType: string): string {
  return isFlowPort(dataType) ? PortCategory.FLOW : PortCategory.DATA;
}

/**
 * Get CSS class for a port based on its data type
 */
function getPortTypeClass(dataType: string): string {
  // Only assign one class, never both
  if (dataType === PortType.CONTROL || dataType === 'control' || dataType === 'flow') {
    return 'port-control';
  }
  return 'port-data';
}

/**
 * Helper to build port class list safely
 */
function buildPortClassList(base: string[], dataType: string): string {
  const typeClass = getPortTypeClass(dataType);
  return [...base, typeClass].filter(Boolean).join(' ');
}