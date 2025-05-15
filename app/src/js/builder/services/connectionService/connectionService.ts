import { NodeInstance } from '../../models/types';
export { initNodeConnections } from './portSetup';
export {
  createConnection,
  cancelConnectionDrawing,
  updateConnections,
  getNodeConnections,
  removeNodeConnections,
  connections
} from './connectionLifecycle';
export {
  exportConnections,
  importConnections,
  clearConnections
} from './connectionIO';
export {
  showConnectionFeedback,
  checkPortsCompatibility
} from './connectionUtils';
export {
  getConnectionState,
  setConnectionState,
  CONNECTION_COLORS,
  PORT_TYPE_COMPATIBILITY
} from './connectionState';

declare const LeaderLine: any;
