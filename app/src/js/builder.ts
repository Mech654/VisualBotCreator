import '../scss/builder.scss';
declare const module: any;

import { initUiSetup } from './builder/uiSetup';
import { initPanelControls } from './builder/panelControls';
import { initCanvasInteractions } from './builder/canvasInteractions';
import { initNodeManagement } from './builder/nodeManagement';
import { initProjectManagement } from './builder/projectManagement';
import { initializeNodes } from './builder/nodeState';
import { initDraggableNodes } from './services/dragDropService';
import { getNodes } from './builder/nodeState';


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
