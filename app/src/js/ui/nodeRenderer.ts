import { NodeInstance } from '../models/types';
import { PortCategory, PortType } from '../../../core/base';

export function generateNodeHtml(nodeInstance: NodeInstance): string {
  const { type, properties, inputs, outputs } = nodeInstance;

  const flowInputs = inputs.filter(input => isFlowPort(input.dataType));
  const dataInputs = inputs.filter(input => !isFlowPort(input.dataType));

  const flowOutputs = outputs.filter(output => isFlowPort(output.dataType));
  const dataOutputs = outputs.filter(output => !isFlowPort(output.dataType));

  const mainInputPort = flowInputs.length > 0 ? flowInputs[0] : null;

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

  let content = '';

  if (properties.nodeContent) {
    content = properties.nodeContent;
  } else {
    content = `<p>${type.charAt(0).toUpperCase() + type.slice(1)} node</p>`;
  }

  const NodeClass = window.nodeSystem?.getNodeClass?.(type);
  let shownProperties: string[] = [];
  if (NodeClass && Array.isArray(NodeClass.shownProperties)) {
    shownProperties = NodeClass.shownProperties;
  }

  let shownPropsHtml = '';
  shownProperties.forEach(key => {
    if (key in properties) {
      shownPropsHtml += `<div class="node-prop" data-property-key="${key}">${properties[key]}</div>`;
    }
  });

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

  const nodeFlowType = hasFlowPorts(inputs, outputs) ? 'flow' : 'data';

  return `
    <div class="node-header">
      <span data-property-key="title">${properties.title || type.charAt(0).toUpperCase() + type.slice(1)}</span>
      <span class="node-menu">⋮</span>
    </div>
    ${flowPortsHtml}
    <div class="node-content" data-property-key="nodeContent">
      ${content}
      ${shownPropsHtml}
    </div>
    ${dataPortsHtml}
  `;
}

function isFlowPort(dataType: string): boolean {
  return dataType === 'control' || dataType === 'flow';
}

function hasFlowPorts(inputs: Array<any>, outputs: Array<any>): boolean {
  return (
    inputs.some(port => isFlowPort(port.dataType)) ||
    outputs.some(port => isFlowPort(port.dataType))
  );
}

function getPortCategory(dataType: string): string {
  return isFlowPort(dataType) ? PortCategory.FLOW : PortCategory.DATA;
}

function getPortTypeClass(dataType: string): string {
  if (dataType === PortType.CONTROL || dataType === 'control' || dataType === 'flow') {
    return 'port-control';
  }
  return 'port-data';
}

function buildPortClassList(base: string[], dataType: string): string {
  const typeClass = getPortTypeClass(dataType);
  return [...base, typeClass].filter(Boolean).join(' ');
}
