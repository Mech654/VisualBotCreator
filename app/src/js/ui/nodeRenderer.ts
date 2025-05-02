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

  // Generate the flow ports HTML for all nodes (including 'condition')
  let flowPortsHtml = '';

  if (hasFlowPorts(inputs, outputs)) {
    flowPortsHtml = `
      <div class="flow-ports">
        <div class="flow-input-ports">
          ${flowInputs
            .map(input => `
              <div class="port-container">
                <div class="${buildPortClassList(['port', 'input-port', 'flow-port'], input.dataType)}"
                  data-port-id="${input.id}"
                  data-port-type="${input.dataType}"
                  data-port-category="${getPortCategory(input.dataType)}"
                  title="${input.label}">
                </div>
              </div>
            `)
            .join('')}
        </div>
        <div class="flow-gap"></div>
        <div class="flow-output-ports">
          ${flowOutputs
            .map(output => `
              <div class="port-container">
                <div class="${buildPortClassList(['port', 'output-port', 'flow-port'], output.dataType)}"
                  data-port-id="${output.id}"
                  data-port-type="${output.dataType}"
                  data-port-category="${getPortCategory(output.dataType)}"
                  title="${output.label}">
                </div>
              </div>
            `)
            .join('')}
        </div>
      </div>
    `;
  }
  // Get node content from backend
  let content = '';

  // Try to get the content from the node instance itself
  if (properties.nodeContent) {
    content = properties.nodeContent;
  } else {
    // Fall back to simple type-based description
    content = `<p>${type.charAt(0).toUpperCase() + type.slice(1)} node</p>`;
  }

  // Generate data ports HTML
  const dataPortsHtml =
    dataInputs.length > 0 || dataOutputs.length > 0
      ? `
    <div class="node-data-ports-container">
      <div class="data-input-ports">
        ${dataInputs
          .map(input => {
            return `
            <div class="data-port-container">
              <div class="${buildPortClassList(['port', 'input-port'], input.dataType)}" 
                   data-port-id="${input.id}" 
                   data-port-type="${input.dataType}" 
                   data-port-category="${getPortCategory(input.dataType)}"
                   title="${input.label}: ${input.dataType}">
              </div>
              <span class="port-label">${input.label}</span>
            </div>
          `;
          })
          .join('')}
      </div>
      <div class="data-output-ports">
        ${dataOutputs
          .map(output => {
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
          })
          .join('')}
      </div>
    </div>
  `
      : '';

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
 * Check if a data type is a flow port
 */
function isFlowPort(dataType: string): boolean {
  return dataType === 'control' || dataType === 'flow';
}

/**
 * Check if node has flow ports
 */
function hasFlowPorts(inputs: Array<any>, outputs: Array<any>): boolean {
  return (
    inputs.some(port => isFlowPort(port.dataType)) ||
    outputs.some(port => isFlowPort(port.dataType))
  );
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
