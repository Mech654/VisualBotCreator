import { NodeInstance } from '../models/types.js';

/**
 * Generates HTML for a node based on its instance data
 */
export function generateNodeHtml(nodeInstance: NodeInstance): string {
  const { type, properties, inputs, outputs } = nodeInstance;
  
  // Generate input ports HTML
  const inputPortsHtml = inputs.map(input => {
    return `<div class="port input-port" data-port-id="${input.id}" data-port-type="${input.dataType}" title="${input.label}"></div>`;
  }).join('');
  
  // Generate output ports HTML
  const outputPortsHtml = outputs.map(output => {
    return `<div class="port output-port" data-port-id="${output.id}" data-port-type="${output.dataType}" title="${output.label}"></div>`;
  }).join('');
  
  // Generate content based on node type
  let content = '';
  
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
      content = `<p>Performing ${properties.operation} operation</p>`;
      break;
    default:
      content = '<p>Configure this node</p>';
  }
  
  // Return the complete node HTML
  return `
    <div class="node-header">
      <span>${properties.title || type.charAt(0).toUpperCase() + type.slice(1)}</span>
      <span>⋮</span>
    </div>
    <div class="node-content">
      ${content}
    </div>
    <div class="node-ports">
      <div class="input-ports">
        ${inputPortsHtml}
      </div>
      <div class="output-ports">
        ${outputPortsHtml}
      </div>
    </div>
  `;
}