import sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { Node, Connection, NodeProperties } from './base';

let db: sqlite3.Database;
let dbPath: string;

function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const baseDir = path.resolve(__dirname, '../..');
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }

      dbPath = path.join(baseDir, 'visualBotCrafter.db');
      console.log('[DB] Initializing at', dbPath);

      db = new sqlite3.Database(dbPath, (err: Error | null) => {
        if (err) {
          console.error('Failed to open database:', err);
          return reject(err);
        }
        db.serialize(() => {
          db.run('PRAGMA journal_mode = WAL;', (err: Error | null) => { if (err) return reject(err); });
          db.run('PRAGMA foreign_keys = ON;', (err: Error | null) => { if (err) return reject(err); });

          db.run(`
            CREATE TABLE IF NOT EXISTS Bots (
              Id TEXT PRIMARY KEY,
              Name TEXT NOT NULL,
              CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
          `, (err: Error | null) => { if (err) return reject(err); });

          db.run(`
            CREATE TABLE IF NOT EXISTS Nodes (
              BotId        VARCHAR(36)   NOT NULL,
              NodeId       VARCHAR(36)   NOT NULL,
              Definition   TEXT          NOT NULL,
              CreatedAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
              UpdatedAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (BotId, NodeId),
              FOREIGN KEY (BotId) REFERENCES Bots(Id) ON DELETE CASCADE
            );
          `, (err: Error | null) => {
            if (err) return reject(err);
            resolve();
          });
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
    const definition = JSON.stringify({ type: node.type, properties: node.properties });

    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO Nodes (BotId, NodeId, Definition, CreatedAt, UpdatedAt)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(BotId, NodeId) DO UPDATE SET
          Definition = excluded.Definition,
          UpdatedAt  = excluded.UpdatedAt
      `, [botId, node.id, definition, now, now], function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          console.error('Error saving node:', err);
          return reject(err);
        }
        resolve({ success: true, nodeId: node.id });
      });
    });
  } catch (err) {
    console.error('Error saving node:', err);
    return { success: false, error: (err as Error).message };
  }
}

async function saveAllNodes(
  botId: string,
  nodes: Node[]
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  try {
    await ensureBotExists(botId);

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (err: Error | null) => { if (err) return reject(err); });

        const stmt = db.prepare(`
          INSERT INTO Nodes (BotId, NodeId, Definition, CreatedAt, UpdatedAt)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(BotId, NodeId) DO UPDATE SET
            Definition = excluded.Definition,
            UpdatedAt  = excluded.UpdatedAt
        `);

        for (const node of nodes) {
          const definition = JSON.stringify({
            type: node.type,
            properties: node.properties,
          });
          stmt.run(botId, node.id, definition, now, now, (err: Error | null) => {
            if (err) {
              db.run('ROLLBACK;', () => reject(err));
              return;
            }
          });
        }
        stmt.finalize((err: Error | null) => {
            if (err) {
                db.run('ROLLBACK;', () => reject(err));
                return;
            }
            db.run('COMMIT;', (commitErr: Error | null) => {
                if (commitErr) return reject(commitErr);
                resolve({ success: true });
            });
        });
      });
    });
  } catch (err) {
    console.error('Error saving all nodes:', err);
    return new Promise((resolve) => {
        db.run('ROLLBACK;', (rollbackErr: Error | null) => {
            if (rollbackErr) console.error('Error rolling back transaction:', rollbackErr);
            resolve({ success: false, error: (err as Error).message });
        });
    });
  }
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

app.whenReady()
  .then(async () => {
    await initDatabase();
    // ...create windows, menus, etc.
  })
  .catch(err => {
    console.error('Initialization error:', err);
    app.quit();
  });

// Ensure we close DB on quit
app.on('before-quit', async (event) => {
  event.preventDefault(); // Prevent immediate quit
  try {
    await closeDB();
  } catch (err) {
    console.error("Error closing DB before quit:", err);
  } finally {
    app.exit(); // Proceed to quit
  }
});

export { saveNode, saveAllNodes, closeDB as close, initDatabase };
