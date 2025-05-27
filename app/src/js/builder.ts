declare const module: any;

import { initUiSetup } from './builder/services/canvasService/uiSetup.js';
import { initPanelControls } from './builder/utils/panelControls.js';
import { initCanvasInteractions } from './builder/services/canvasService/canvasInteractions.js';
import { initNodeManagement } from './builder/services/nodeService/nodeManagement.js';
import { initProjectManagement } from './builder/services/projectService/projectManagement.js';
import { initializeNodes } from './builder/services/nodeService/nodeState.js';
import { initDraggableNodes } from './builder/services/dragDropService/dragDropService.js';
import { getNodes } from './builder/services/nodeService/nodeState.js';

interface Window {
  nodeSystem: {
    createConnection: (
      fromNodeId: string,
      fromPortId: string,
      toNodeId: string,
      toPortId: string
    ) => Promise<void>;
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  initializeNodes();
  await initUiSetup();
  initPanelControls();
  initCanvasInteractions();
  initNodeManagement();
  initProjectManagement();
  initDraggableNodes(getNodes(), getNodes());
});

if (typeof module !== 'undefined' && module.hot) {
  module.hot.accept();
}
