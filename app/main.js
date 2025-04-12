const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Node, Port, Connection, NodeFactory } = require('./core/nodeSystem');

// Store created nodes for reference
const nodeInstances = new Map();

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // For security, disable nodeIntegration
      contextIsolation: true, // Enable context isolation for security
      preload: path.join(__dirname, 'preload.js') // Use our preload script
    }
  });

  win.loadFile('app/src/index.html');
  
  // Open DevTools in development mode
  win.webContents.openDevTools();
}

// Set up IPC handlers for node system operations
function setupIpcHandlers() {
  // Handle node creation requests
  ipcMain.handle('node:create', async (event, { type, id, properties }) => {
    try {
      const node = NodeFactory.createNode(type, id, properties);
      // Store node instance for future reference
      nodeInstances.set(id, node);
      
      // Return node data (safe to stringify)
      return {
        id: node.id,
        type: node.type,
        properties: node.properties,
        inputs: node.inputs.map(input => ({
          id: input.id,
          label: input.label,
          dataType: input.dataType
        })),
        outputs: node.outputs.map(output => ({
          id: output.id,
          label: output.label,
          dataType: output.dataType
        }))
      };
    } catch (error) {
      console.error('Error creating node:', error);
      throw new Error(`Failed to create node: ${error.message}`);
    }
  });
  
  // Get all available node types
  ipcMain.handle('node:getTypes', async () => {
    return [
      { type: 'start', name: 'Start', category: 'Conversation Flow' },
      { type: 'message', name: 'Message', category: 'Conversation Flow' },
      { type: 'options', name: 'Options', category: 'Conversation Flow' },
      { type: 'input', name: 'User Input', category: 'Conversation Flow' },
      { type: 'condition', name: 'Condition', category: 'Logic' },
      { type: 'math', name: 'Math', category: 'Logic' }
    ];
  });
  
  // Get node by ID
  ipcMain.handle('node:getById', async (event, id) => {
    const node = nodeInstances.get(id);
    if (!node) {
      throw new Error(`Node not found with id: ${id}`);
    }
    
    return {
      id: node.id,
      type: node.type,
      properties: node.properties,
      inputs: node.inputs.map(input => ({
        id: input.id,
        label: input.label,
        dataType: input.dataType
      })),
      outputs: node.outputs.map(output => ({
        id: output.id,
        label: output.label,
        dataType: output.dataType
      }))
    };
  });
  
  // Process a node with inputs
  ipcMain.handle('node:process', async (event, { id, inputs }) => {
    const node = nodeInstances.get(id);
    if (!node) {
      throw new Error(`Node not found with id: ${id}`);
    }
    
    try {
      const result = node.process(inputs);
      return result;
    } catch (error) {
      console.error(`Error processing node ${id}:`, error);
      throw new Error(`Failed to process node: ${error.message}`);
    }
  });
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});