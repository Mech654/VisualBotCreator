import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Node, Connection, PortCategory, PortType, PORT_CATEGORIES } from './core/base.js';
import { initDatabase } from './core/database.js';
import { setupIpcHandlers } from './ipcs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');

// Store created nodes for reference
export const nodeInstances = new Map<string, Node>();

// Store created connections
export const connections: Connection[] = [];

function createWindow(): void {
  const iconPath = path.join(app.getAppPath(), 'dist', 'src', 'assets', 'images', 'mascot.png');
  //Menu.setApplicationMenu(null);

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(projectRoot, 'dist', 'preload-esm.mjs'),
      webSecurity: true,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    const startUrl =
      typeof process.env.ELECTRON_START_URL === 'string' &&
      process.env.ELECTRON_START_URL.trim() !== ''
        ? process.env.ELECTRON_START_URL
        : 'http://localhost:4000/src/index.html';

    // eslint-disable-next-line no-console
    console.log(`Electron is running in development mode, loading from ${startUrl}`);

    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 1500;

    const loadApp = (): void => {
      mainWindow.loadURL(startUrl).catch(err => {
        retryCount++;
        if (retryCount <= maxRetries) {
          // eslint-disable-next-line no-console
          console.log(`Connection to dev server failed, retrying (${retryCount}/${maxRetries})...`);
          setTimeout(loadApp, retryInterval);
        } else {
          // eslint-disable-next-line no-console
          console.error('Failed to connect to webpack dev server after multiple attempts', err);
          // Fallback to loading from file system
          mainWindow
            .loadFile(path.join(projectRoot, 'dist', 'src', 'index.html'))
            .catch(e => console.error('Failed to load fallback file:', e));
        }
      });
    };

    loadApp();
    mainWindow.webContents.openDevTools();
  } else {
    // eslint-disable-next-line no-console
    console.log('Electron is running in production mode, loading from file');
    mainWindow
      .loadFile(path.join(projectRoot, 'dist', 'src', 'index.html'))
      .catch(e => console.error('Failed to load file:', e));
    mainWindow.webContents.openDevTools();
  }
}

//Check if two port types are compatible for connection
const PORT_TYPE_COMPATIBILITY: Record<PortType, PortType[]> = {
  [PortType.ANY]: Object.values(PortType).filter(type => type !== PortType.CONTROL) as PortType[],
  [PortType.NUMBER]: [PortType.STRING],
  [PortType.BOOLEAN]: [PortType.STRING],
  [PortType.STRING]: [PortType.NUMBER],
  [PortType.OBJECT]: [],
  [PortType.ARRAY]: [],
  [PortType.CONTROL]: [],
};

export function arePortTypesCompatible(sourceType: string, targetType: string): boolean {
  const sourceIsFlow = PORT_CATEGORIES[PortCategory.FLOW].includes(sourceType as PortType);
  const targetIsFlow = PORT_CATEGORIES[PortCategory.FLOW].includes(targetType as PortType);

  if (sourceIsFlow !== targetIsFlow) {
    return false;
  }
  if (sourceIsFlow && targetIsFlow) {
    return true;
  }
  if ((sourceType as PortType) === PortType.ANY || (targetType as PortType) === PortType.ANY) {
    return true;
  }
  if (sourceType === targetType) {
    return true;
  }
  const compatibleTypes = Array.isArray(PORT_TYPE_COMPATIBILITY[sourceType as PortType])
    ? PORT_TYPE_COMPATIBILITY[sourceType as PortType]
    : [];
  return compatibleTypes.includes(targetType as PortType);
}

async function main(): Promise<void> {
  try {
    await initDatabase();
    createWindow();
    setupIpcHandlers();
  } catch (err) {
    console.error('Failed to start application:', err);
  }
}

void app.whenReady().then(() => {
  main().catch(err => {
    console.error('Error in main():', err);
  });

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
