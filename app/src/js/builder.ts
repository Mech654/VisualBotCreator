import '../scss/builder.scss';
declare const module: any;

import { initUiSetup } from './builder/services/canvasService/uiSetup';
import { initPanelControls } from './builder/utils/panelControls';
import { initCanvasInteractions } from './builder/services/canvasService/canvasInteractions';
import { initNodeManagement } from './builder/services/nodeService/nodeManagement';
import { initProjectManagement } from './builder/services/projectService/projectManagement';
import { initializeNodes } from './builder/services/nodeService/nodeState';
import { initDraggableNodes } from './builder/services/dragDropService/dragDropService';
import { getNodes } from './builder/services/nodeService/nodeState';

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

if (module && module.hot) {
  module.hot.accept();
}
