import { ConnectionMode, ConnectionState } from '../../models/types.js';
import { PortCategory, PortType } from '../../../../../core/base.js';

export let connectionState: ConnectionState = {
  mode: ConnectionMode.NONE,
};

export const CONNECTION_COLORS = {
  [PortCategory.FLOW]: '#e67e22',
  [PortCategory.DATA]: '#3498db',
};

export const PORT_TYPE_COMPATIBILITY: Record<string, string[]> = {
  [PortType.ANY]: [
    PortType.STRING,
    PortType.NUMBER,
    PortType.BOOLEAN,
    PortType.OBJECT,
    PortType.ARRAY,
    PortType.ANY,
  ],
  [PortType.NUMBER]: [PortType.STRING],
  [PortType.BOOLEAN]: [PortType.STRING],
  [PortType.STRING]: [],
  [PortType.OBJECT]: [],
  [PortType.ARRAY]: [],
  [PortType.CONTROL]: [],
};

export function setConnectionState(newState: ConnectionState): void {
  connectionState = newState;
}

export function getConnectionState(): ConnectionState {
  return connectionState;
}
