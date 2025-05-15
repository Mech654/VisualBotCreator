import { PortCategory, PortType } from '../../../../../core/base';
import { PORT_TYPE_COMPATIBILITY } from './connectionState';

export function showConnectionFeedback(portElement: HTMLElement, message: string, color: string): void {
  const existingTooltip = document.querySelector('.port-tooltip');
  if (existingTooltip) existingTooltip.remove();

  const tooltip = document.createElement('div');
  tooltip.className = 'port-tooltip';
  tooltip.textContent = message;
  tooltip.style.position = 'absolute';
  tooltip.style.background = color;
  tooltip.style.color = 'white';
  tooltip.style.padding = '4px 8px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.fontSize = '12px';
  tooltip.style.zIndex = '100';
  tooltip.style.pointerEvents = 'none';

  const rect = portElement.getBoundingClientRect();
  const canvasRect = document.getElementById('canvas')?.getBoundingClientRect();

  if (canvasRect) {
    tooltip.style.left = `${rect.left + rect.width / 2 - canvasRect.left}px`;
    tooltip.style.top = `${rect.top - 30 - canvasRect.top}px`;
    document.getElementById('canvas')?.appendChild(tooltip);
  }
}

export function checkPortsCompatibility(
  sourcePort: HTMLElement,
  targetPort: HTMLElement
): { compatible: boolean; reason: string } {
  const isSourceOutput = sourcePort.classList.contains('output-port');
  const isTargetInput = targetPort.classList.contains('input-port');

  if (!isSourceOutput || !isTargetInput) {
    return {
      compatible: false,
      reason: 'Must connect from output to input',
    };
  }

  const sourceCategory =
    sourcePort.dataset.portCategory ||
    (sourcePort.dataset.portType === PortType.CONTROL ? PortCategory.FLOW : PortCategory.DATA);

  const targetCategory =
    targetPort.dataset.portCategory ||
    (targetPort.dataset.portType === PortType.CONTROL ? PortCategory.FLOW : PortCategory.DATA);

  if (sourceCategory !== targetCategory) {
    return {
      compatible: false,
      reason: 'Category mismatch',
    };
  }

  if (sourceCategory === PortCategory.FLOW && targetCategory === PortCategory.FLOW) {
    return { compatible: true, reason: 'Flow ports match' };
  }

  const sourceType = sourcePort.dataset.portType || '';
  const targetType = targetPort.dataset.portType || '';

  if (sourceType === PortType.ANY || targetType === PortType.ANY) {
    return { compatible: true, reason: 'Compatible via ANY type' };
  }

  if (sourceType === targetType) {
    return { compatible: true, reason: 'Types match' };
  }

  const compatibleTypes = PORT_TYPE_COMPATIBILITY[sourceType] || [];
  if (compatibleTypes.includes(targetType)) {
    return { compatible: true, reason: `${sourceType} can convert to ${targetType}` };
  }

  return {
    compatible: false,
    reason: `Type mismatch: ${sourceType} → ${targetType}`,
  };
}
