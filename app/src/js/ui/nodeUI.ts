// Utility functions for node UI updates and event listeners
import { NodeInstance } from '../models/types';

/**
 * Update the node's DOM element content based on its properties.
 */
export function updateNodeElementContent(
  nodeInstance: NodeInstance,
  nodeElement: HTMLElement
): void {
  if (!nodeElement) return;
  Object.entries(nodeInstance.properties).forEach(([key, value]) => {
    // Find all elements inside the node with data-property-key matching this property
    const propElements = nodeElement.querySelectorAll(`[data-property-key="${key}"]`);
    propElements.forEach(el => {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        if (el.type === 'checkbox') {
          (el as HTMLInputElement).checked = Boolean(value);
        } else {
          el.value = value ?? '';
        }
      } else if (el instanceof HTMLElement) {
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
 * Attach event listeners to the property panel for a node.
 * Calls the provided callback when a property changes.
 */
export function setupPropertyEventListeners(
  nodeInstance: NodeInstance,
  panel: HTMLElement,
  onPropertyChange: (key: string, value: any) => void
): void {
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
        onPropertyChange(propertyKey, value);
      }
    });
  });
}
