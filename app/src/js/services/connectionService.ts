import { NodeInstance } from '../models/types';
export { initNodeConnections } from '../builder/portSetup';
export {
  createConnection,
  cancelConnectionDrawing,
  updateConnections,
  getNodeConnections,
  removeNodeConnections,
  connections
} from '../builder/connectionLifecycle';
export {
  exportConnections,
  importConnections,
  clearConnections
} from '../builder/connectionIO';
export {
  showConnectionFeedback,
  checkPortsCompatibility
} from '../builder/connectionUtils';
export {
  getConnectionState,
  setConnectionState,
  CONNECTION_COLORS,
  PORT_TYPE_COMPATIBILITY
} from '../builder/connectionState';

declare const LeaderLine: any;
