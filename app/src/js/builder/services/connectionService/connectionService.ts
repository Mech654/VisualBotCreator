import { NodeInstance } from '../../models/types.js';
export { initNodeConnections } from './portSetup.js';
export {
  createConnection,
  cancelConnectionDrawing,
  updateConnections,
  getNodeConnections,
  removeNodeConnections,
  connections,
} from './connectionLifecycle.js';
export { exportConnections, importConnections, clearConnections } from './connectionIO.js';
export { showConnectionFeedback, checkPortsCompatibility } from './connectionUtils.js';
export {
  getConnectionState,
  setConnectionState,
  CONNECTION_COLORS,
  PORT_TYPE_COMPATIBILITY,
} from './connectionState.js';

declare const LeaderLine: any;
