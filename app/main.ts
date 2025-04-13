import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Node, NodeProperties } from './core/base.js';
import { NodeFactory } from './core/nodeSystem.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the project root directory (two levels up from __dirname)
const projectRoot = path.resolve(__dirname, '..');

// Store created nodes for reference
const nodeInstances = new Map<string, Node>();

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Use ES module preload script with .mjs extension
      preload: path.resolve(projectRoot, 'dist', 'preload-esm.mjs'),
      webSecurity: true, 
      sandbox: false
    }
  });

  // Updated to use path.join for proper cross-platform path resolution
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  
  // Open DevTools in development mode
  mainWindow.webContents.openDevTools();
}

// Set up IPC handlers for node system operations
function setupIpcHandlers(): void {
  // Handle node creation requests
  ipcMain.handle('node:create', async (event, { type, id, properties }: { type: string, id: string, properties: NodeProperties }) => {
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
      throw new Error(`Failed to create node: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  
  // Get all available node types
  ipcMain.handle('node:getTypes', async () => {
    return NodeFactory.getRegisteredTypes();
  });
  
  // Get node by ID
  ipcMain.handle('node:getById', async (event, id: string) => {
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
  ipcMain.handle('node:process', async (event, { id, inputs }: { id: string, inputs: Record<string, any> }) => {
    const node = nodeInstances.get(id);
    if (!node) {
      throw new Error(`Node not found with id: ${id}`);
    }
    
    try {
      const result = node.process(inputs);
      return result;
    } catch (error) {
      console.error(`Error processing node ${id}:`, error);
      throw new Error(`Failed to process node: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});