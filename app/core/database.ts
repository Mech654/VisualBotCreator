import sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { fileURLToPath } from 'url';
import { Node, Connection, NodeProperties } from './base';

let db: sqlite3.Database;
let dbPath: string;

function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Use userData directory for writable storage, fallback to app path for development
      let baseDir: string;
      if (app.isPackaged) {
        // In packaged app (AppImage, exe, etc.), use userData directory
        baseDir = app.getPath('userData');
      } else {
        // In development, use project root
        const appPath = app.getAppPath();
        baseDir = path.resolve(appPath);
      }

      // Additional fallback for AppImage if userData fails
      if (app.isPackaged && !fs.existsSync(path.dirname(baseDir))) {
        console.log('[DB] userData directory parent does not exist, trying temp directory');
        baseDir = path.join(require('os').tmpdir(), 'VisualBotCreator');
      }

      if (!fs.existsSync(baseDir)) {
        console.log(`[DB] Creating directory: ${baseDir}`);
        fs.mkdirSync(baseDir, { recursive: true });
      }
      dbPath = path.join(baseDir, 'VisualBotCreator.db');
      console.log('[DB] App packaged:', app.isPackaged);
      console.log('[DB] Initializing at', dbPath);
      console.log('[DB] Directory exists:', fs.existsSync(baseDir));

      // Test write permissions
      try {
        fs.accessSync(baseDir, fs.constants.W_OK);
        console.log('[DB] Directory is writable');
      } catch (accessErr) {
        console.error('[DB] Directory is not writable:', accessErr);
        throw new Error(`Database directory is not writable: ${baseDir}`);
      }

      db = new sqlite3.Database(dbPath, (err: Error | null) => {
        if (err) {
          console.error('Failed to open database:', err);
          return reject(err);
        }
        db.serialize(() => {
          db.run('PRAGMA journal_mode = WAL;', (err: Error | null) => {
            if (err) return reject(err);
          });
          db.run('PRAGMA foreign_keys = ON;', (err: Error | null) => {
            if (err) return reject(err);
          });

          db.run(
            `
            CREATE TABLE IF NOT EXISTS Bots (
              Id TEXT PRIMARY KEY,
              Name TEXT NOT NULL DEFAULT 'Unnamed Bot',
              CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              enabled INTEGER NOT NULL DEFAULT 1,
              description TEXT NOT NULL DEFAULT '',
              run_success_count INTEGER NOT NULL DEFAULT 0,
              run_failure_count INTEGER NOT NULL DEFAULT 0
            );
          `,
            (err: Error | null) => {
              if (err) return reject(err);
            }
          );

          db.run(
            `
            CREATE TABLE IF NOT EXISTS Nodes (
              BotId        TEXT   NOT NULL,
              NodeId       TEXT   NOT NULL,
              Definition   TEXT   NOT NULL,
              CreatedAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
              UpdatedAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (BotId, NodeId),
              FOREIGN KEY (BotId) REFERENCES Bots(Id) ON DELETE CASCADE ON UPDATE CASCADE
            );
          `,
            (err: Error | null) => {
              if (err) return reject(err);
            }
          );

          db.run(
            `
            CREATE TABLE IF NOT EXISTS RunConditions (
              BotId      TEXT NOT NULL,
              Key        TEXT NOT NULL,
              Value      TEXT NOT NULL,
              UpdatedAt  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (BotId, Key),
              FOREIGN KEY (BotId) REFERENCES Bots(Id) ON DELETE CASCADE ON UPDATE CASCADE
            );
          `,
            (err: Error | null) => {
              if (err) return reject(err);
              resolve();
            }
          );
        });
      });
    } catch (error) {
      console.error('Failed to initialize database:', error);
      reject(error);
    }
  });
}

function ensureBotExists(botId: string, name: string = 'Unnamed Bot'): Promise<void> {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    db.get('SELECT Id FROM Bots WHERE Id = ?', [botId], (err: Error | null, row: any) => {
      if (err) return reject(err);
      if (!row) {
        db.run(
          'INSERT INTO Bots (Id, Name, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?)',
          [botId, name, now, now],
          (err: Error | null) => {
            if (err) return reject(err);
            resolve();
          }
        );
      } else {
        db.run('UPDATE Bots SET UpdatedAt = ? WHERE Id = ?', [now, botId], (err: Error | null) => {
          if (err) return reject(err);
          resolve();
        });
      }
    });
  });
}

async function saveNode(
  botId: string,
  node: Node
): Promise<{ success: boolean; nodeId?: string; error?: string }> {
  const now = new Date().toISOString();
  try {
    await ensureBotExists(botId);
    const definition = JSON.stringify({
      type: node.type,
      position: node.position,
      properties: node.properties,
      inputs: node.inputs.map(port => ({
        id: port.id,
        label: port.label,
        dataType: port.dataType,
        category: port.category,
        propertyKey: port.propertyKey,
        connectedTo: port.connectedTo.map(conn => ({
          fromNodeId: conn.fromNodeId,
          fromPortId: conn.fromPortId,
          toNodeId: conn.toNodeId,
          toPortId: conn.toPortId,
        })),
      })),
      outputs: node.outputs.map(port => ({
        id: port.id,
        label: port.label,
        dataType: port.dataType,
        category: port.category,
        propertyKey: port.propertyKey,
        connectedTo: port.connectedTo.map(conn => ({
          fromNodeId: conn.fromNodeId,
          fromPortId: conn.fromPortId,
          toNodeId: conn.toNodeId,
          toPortId: conn.toPortId,
        })),
      })),
    });
    console.log('[DATABASE] Saving node:', node.id, 'for bot:', botId);
    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO Nodes (BotId, NodeId, Definition, CreatedAt, UpdatedAt)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(BotId, NodeId) DO UPDATE SET
          Definition = excluded.Definition,
          UpdatedAt  = excluded.UpdatedAt
      `,
        [botId, node.id, definition, now, now],
        function (this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            console.error('Error saving node:', err);
            return reject(err);
          }
          resolve({ success: true, nodeId: node.id });
        }
      );
    });
  } catch (err) {
    console.error('Error saving node:', err);
    return { success: false, error: (err as Error).message };
  }
}

async function saveAllNodes(
  botId: string,
  nodes: { [key: string]: Node }
): Promise<{ success: boolean; error?: string }> {
  // True overwrite semantics: remove stale nodes not present in the provided set, atomically.
  try {
    await ensureBotExists(botId);
    const newNodeIds = new Set(Object.keys(nodes));
    return await new Promise((resolve) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        // Delete stale nodes
        db.run(
          `DELETE FROM Nodes WHERE BotId = ? AND NodeId NOT IN (${Array.from(newNodeIds)
            .map(() => '?')
            .join(',') || "''"})`,
          [botId, ...Array.from(newNodeIds)],
          (delErr: Error | null) => {
            if (delErr) {
              console.error('Error deleting stale nodes:', delErr);
              db.run('ROLLBACK', () =>
                resolve({ success: false, error: delErr.message })
              );
              return;
            }

            // Upsert each current node sequentially inside transaction
            const entries = Object.entries(nodes);
            let index = 0;
            const upsertNext = () => {
              if (index >= entries.length) {
                db.run('COMMIT', (commitErr: Error | null) => {
                  if (commitErr) {
                    console.error('Commit failed:', commitErr);
                    db.run('ROLLBACK', () =>
                      resolve({ success: false, error: commitErr.message })
                    );
                  } else {
                    resolve({ success: true });
                  }
                });
                return;
              }
              const [nodeId, node] = entries[index++];
              saveNode(botId, node)
                .then(r => {
                  if (!r.success) {
                    console.error('Upsert failed for node', nodeId, r.error);
                    db.run('ROLLBACK', () =>
                      resolve({ success: false, error: r.error })
                    );
                  } else {
                    upsertNext();
                  }
                })
                .catch(err => {
                  console.error('Upsert exception for node', nodeId, err);
                  db.run('ROLLBACK', () =>
                    resolve({ success: false, error: (err as Error).message })
                  );
                });
            };
            upsertNext();
          }
        );
      });
    });
  } catch (err) {
    console.error('Error saving all nodes (outer):', err);
    return { success: false, error: (err as Error).message };
  }
}

// Get all bots from the Bots table
function getAllBots(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM Bots WHERE Id <> 'debug'", [], (err: Error | null, rows: any[]) => {
      if (err) {
        console.error('Error fetching bots:', err);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

// Get all nodes for a specific bot
function getBotNodes(botId: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT NodeId, Definition FROM Nodes WHERE BotId = ?',
      [botId],
      (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Error fetching bot nodes:', err);
          return reject(err);
        }

        // Parse the Definition JSON for each node
        const parsedNodes = rows
          .map(row => {
            try {
              const definition = JSON.parse(row.Definition);
              return {
                nodeId: row.NodeId,
                ...definition,
              };
            } catch (parseErr) {
              console.error('Error parsing node definition:', parseErr);
              return null;
            }
          })
          .filter(node => node !== null);

        resolve(parsedNodes);
      }
    );
  });
}

// Get run conditions for a bot
function getRunConditions(botId: string): Promise<{ Key: string; Value: string }[]> {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT Key, Value FROM RunConditions WHERE BotId = ?',
      [botId],
      (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Error fetching run conditions:', err);
          return reject(err);
        }
        resolve(rows);
      }
    );
  });
}

// Set bot enabled/disabled
function setBotEnabled(botId: string, enabled: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE Bots SET enabled = ?, UpdatedAt = ? WHERE Id = ?',
      [enabled ? 1 : 0, new Date().toISOString(), botId],
      (err: Error | null) => {
        if (err) {
          console.error('Error updating bot enabled:', err);
          return reject(err);
        }
        resolve();
      }
    );
  });
}

function closeDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err: Error | null) => {
        if (err) {
          console.error('Error closing database:', err);
          return reject(err);
        }
        console.log('Database connection closed.');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

function changeNameDb(oldId: string, newId: string): Promise<{ success: boolean; error?: string }> {
  if (!oldId || !newId) {
    return Promise.resolve({ success: false, error: 'Both old and new IDs are required.' });
  }
  if (typeof oldId !== 'string' || typeof newId !== 'string') {
    return Promise.resolve({ success: false, error: 'IDs must be strings.' });
  }
  if (oldId === newId) {
    return Promise.resolve({ success: true }); // No change needed
  }
  console.log('[DATABASE] Attempting to change bot Id and Name - oldId:', oldId, 'newId:', newId);
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    db.run(
      'UPDATE Bots SET Id = ?, Name = ?, UpdatedAt = ? WHERE Id = ?',
      [newId, newId, now, oldId],
      function (this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          console.error('[DATABASE] Error updating bot Id and Name:', err);
          return resolve({ success: false, error: err.message }); // Return error as part of result
        }
        if (this.changes === 0) {
          console.warn('[DATABASE] No bot found with Id to update:', oldId);
          return resolve({ success: false, error: 'Bot with the original ID not found.' });
        }
        console.log('[DATABASE] Bot Id and Name updated successfully to:', newId);
        resolve({ success: true });
      }
    );
  });
}

function changeDescriptionDb(botId: string, newDescription: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    db.run(
      'UPDATE Bots SET description = ?, UpdatedAt = ? WHERE Id = ?',
      [newDescription, now, botId],
      (err: Error | null) => {
        if (err) {
          console.error('Error updating bot description:', err);
          return reject(err);
        }
        resolve();
      }
    );
  });
}

function changeStatusDb(botId: string, newStatus: boolean): Promise<void> {
  return setBotEnabled(botId, newStatus);
}

function addOrUpdateBotConditionDb(botId: string, key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO RunConditions (BotId, Key, Value, UpdatedAt)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(BotId, Key) DO UPDATE SET
         Value = excluded.Value,
         UpdatedAt = excluded.UpdatedAt`,
      [botId, key, value, now],
      (err: Error | null) => {
        if (err) {
          console.error('Error adding/updating bot condition:', err);
          return reject(err);
        }
        resolve();
      }
    );
  });
}

function deleteBotConditionDb(botId: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM RunConditions WHERE BotId = ? AND Key = ?',
      [botId, key],
      (err: Error | null) => {
        if (err) {
          console.error('Error deleting bot condition:', err);
          return reject(err);
        }
        resolve();
      }
    );
  });
}

function removeBotFromDatabase(botId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM Bots WHERE Id = ?',
      [botId],
      function (this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          console.error('Error removing bot from database:', err);
          return reject(err);
        }
        if (this.changes === 0) {
          console.warn('No bot found with Id to remove:', botId);
          return resolve();
        }
        console.log('Bot removed successfully:', botId);
        resolve();
      }
    );
  });
}

async function saveDebugNodes(
  nodes: { [key: string]: Node }
): Promise<{ success: boolean; error?: string }> {
  try {
    const botId = 'debug';
    await ensureBotExists(botId);
    for (const [nodeId, node] of Object.entries(nodes)) {
      const result = await saveNode(botId, node);
      if (!result.success) {
        return { success: false, error: result.error };
      }
    }
    return { success: true };
  } catch (err) {
    console.error('Error saving all nodes:', err);
    return { success: false, error: (err as Error).message };
  }
}


app
  .whenReady()
  .then(async () => {
    await initDatabase();
  })
  .catch(err => {
    console.error('Initialization error:', err);
    app.quit();
  });

// Ensure we close DB on quit
app.on('before-quit', async event => {
  event.preventDefault(); // Prevent immediate quit
  try {
    await closeDB();
  } catch (err) {
    console.error('Error closing DB before quit:', err);
  } finally {
    app.exit(); // Proceed to quit
  }
});

// PS : I Dont like this(those with app) code gonna remove it later

export {
  saveNode,
  saveAllNodes,
  closeDB as close,
  initDatabase,
  getAllBots,
  getBotNodes,
  getRunConditions,
  setBotEnabled,
  changeNameDb,
  changeDescriptionDb,
  changeStatusDb,
  addOrUpdateBotConditionDb,
  deleteBotConditionDb,
  removeBotFromDatabase,
  saveDebugNodes,
};
