// Port categories and types
export enum PortCategory {
  FLOW = 'flow',
  DATA = 'data',
}

export enum PortType {
  // Flow types
  CONTROL = 'control',

  // Data types
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  ANY = 'any',
}

// Port category to types mapping
export const PORT_CATEGORIES = {
  [PortCategory.FLOW]: [PortType.CONTROL],
  [PortCategory.DATA]: [
    PortType.STRING,
    PortType.NUMBER,
    PortType.BOOLEAN,
    PortType.OBJECT,
    PortType.ARRAY,
    PortType.ANY,
  ],
};

export interface NodeProperties {
  [key: string]: any;
}

export interface PortData {
  id: string;
  label: string;
  dataType: string;
  category?: PortCategory;
}

export class Node {
  static shownProperties: string[] = [];
  
  id: string;
  type: string;
  properties: NodeProperties;
  inputs: Port[];
  outputs: Port[];

  constructor(id: string, type: string, properties: NodeProperties = {}) {
    this.id = id;
    this.type = type;
    this.properties = properties;
    this.inputs = [];
    this.outputs = [];
  }

  addInput(port: Port): void {
    this.inputs.push(port);
  }

  addOutput(port: Port): void {
    this.outputs.push(port);
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    throw new Error(`Process method not implemented for node type: ${this.type}`);
  }

  /**
   * Generate the HTML for this node's properties panel
   */
  generatePropertiesPanel(): string {
    let html = `<div class="property-group-title">${this.type.charAt(0).toUpperCase() + this.type.slice(1)} Properties</div>`;
    const skipProps = ['title', 'id'];
    const properties = Object.entries(this.properties).filter(([key]) => !skipProps.includes(key));
    if (properties.length === 0) {
      html += `
        <div class="property-item">
          <div class="property-label">No configurable properties</div>
        </div>
      `;
    } else {
      properties.forEach(([key, value]) => {
        const propertyType = typeof value;
        switch (propertyType) {
          case 'string':
            if (String(value).length > 50) {
              html += `
                <div class="property-item" data-tooltip="Edit ${key}">
                  <div class="property-label">${this.formatPropertyName(key)}</div>
                  <textarea class="property-input dynamic-property" 
                        data-property-key="${key}"
                        rows="3">${value}</textarea>
                </div>
              `;
            } else {
              html += `
                <div class="property-item" data-tooltip="Edit ${key}">
                  <div class="property-label">${this.formatPropertyName(key)}</div>
                  <input type="text" class="property-input dynamic-property" 
                        value="${value}" 
                        data-property-key="${key}">
                </div>
              `;
            }
            break;
          case 'number':
            html += `
              <div class="property-item" data-tooltip="Edit ${key}">
                <div class="property-label">${this.formatPropertyName(key)}</div>
                <input type="number" class="property-input dynamic-property" 
                      value="${value}" 
                      data-property-key="${key}">
              </div>
            `;
            break;
          case 'boolean':
            html += `
              <div class="property-item" data-tooltip="Toggle ${key}">
                <div class="property-label">${this.formatPropertyName(key)}</div>
                <label class="switch">
                  <input type="checkbox" class="dynamic-property" 
                        ${value ? 'checked' : ''} 
                        data-property-key="${key}">
                  <span class="slider round"></span>
                </label>
              </div>
            `;
            break;
          case 'object':
            const objStr = JSON.stringify(value, null, 2);
            html += `
              <div class="property-item" data-tooltip="Edit ${key} (JSON)">
                <div class="property-label">${this.formatPropertyName(key)}</div>
                <textarea class="property-input dynamic-property json-property" 
                      data-property-key="${key}"
                      rows="3">${objStr}</textarea>
              </div>
            `;
            break;
          default:
            html += `
              <div class="property-item" data-tooltip="${key}">
                <div class="property-label">${this.formatPropertyName(key)}</div>
                <div class="property-value">${String(value)}</div>
              </div>
            `;
        }
      });
    }
    return html;
  }

  /**
   * Update the node's visual content in the DOM for all properties when a property changes
   * This will update any element inside the node DOM with a matching data-property-key attribute
   */
  updateNodeElementContent(): void {
    const nodeElement = document.querySelector(`[data-node-id="${this.id}"]`);
    if (!nodeElement) return;
    Object.entries(this.properties).forEach(([key, value]) => {
      // Find all elements inside the node with data-property-key matching this property
      const propElements = nodeElement.querySelectorAll(`[data-property-key="${key}"]`);
      propElements.forEach((el) => {
        // Update value, textContent, or innerHTML depending on element type
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          if (el.type === 'checkbox') {
            (el as HTMLInputElement).checked = Boolean(value);
          } else {
            el.value = value ?? '';
          }
        } else if (el instanceof HTMLElement) {
          // For content elements, prefer innerHTML for strings, else textContent
          if (typeof value === 'string') {
            el.innerHTML = value;
          } else {
            el.textContent = String(value);
          }
        }
      });
    });
  }

  /**
   * Hook for adding event listeners to the property panel
   */
  setupPropertyEventListeners(panel: HTMLElement): void {
    const propertyInputs = panel.querySelectorAll('.dynamic-property');
    propertyInputs.forEach(input => {
      input.addEventListener('change', e => {
        const element = e.target as HTMLInputElement | HTMLTextAreaElement;
        const propertyKey = element.dataset.propertyKey;
        if (propertyKey) {
          let value: any;
          if (element.type === 'checkbox') {
            value = (element as HTMLInputElement).checked;
          } else if (element.type === 'number') {
            value = Number(element.value);
          } else if (element.classList.contains('json-property')) {
            try {
              value = JSON.parse(element.value);
            } catch (error) {
              console.error('Invalid JSON:', error);
              return;
            }
          } else {
            value = element.value;
          }
          this.properties[propertyKey] = value;
          // If nodeContent is updated, update the DOM
          if (propertyKey === 'nodeContent' || propertyKey === 'condition') {
            // Only call updateNodeContent if it exists on the instance
            if (typeof (this as any).updateNodeContent === 'function') {
              (this as any).updateNodeContent();
            }
            this.updateNodeElementContent();
          }
        }
      });
    });
  }
//test
  /**
   * Format a property key into a readable label
   */
  private formatPropertyName(key: string): string {
    return (
      key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
    );
  }
}

export class Port {
  id: string;
  label: string;
  dataType: string;
  category: PortCategory;
  connectedTo: Connection[];

  constructor(id: string, label: string, dataType: string) {
    this.id = id;
    this.label = label;
    this.dataType = dataType;
    // Determine category based on data type
    this.category = PORT_CATEGORIES[PortCategory.FLOW].includes(dataType as PortType)
      ? PortCategory.FLOW
      : PortCategory.DATA;
    this.connectedTo = [];
  }
}

export class Connection {
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;

  constructor(fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) {
    this.fromNodeId = fromNodeId;
    this.fromPortId = fromPortId;
    this.toNodeId = toNodeId;
    this.toPortId = toPortId;
  }
}
