import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { Node, Connection, NodeProperties } from './base';

let db: Database.Database;
let dbPath: string;

function initDatabase(): void {
  try {

    const baseDir = path.resolve(__dirname, '../..');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    dbPath = path.join(baseDir, 'visualBotCrafter.db');
    console.log('[DB] Initializing at', dbPath);

    db = new Database(dbPath);
    db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS Bots (
        Id TEXT PRIMARY KEY,
        Name TEXT NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Nodes (
        BotId        VARCHAR(36)   NOT NULL,
        NodeId       VARCHAR(36)   NOT NULL,
        Definition   TEXT          NOT NULL,
        CreatedAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (BotId, NodeId),
        FOREIGN KEY (BotId) REFERENCES Bots(Id) ON DELETE CASCADE
      );
    `);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

function ensureBotExists(botId: string, name: string = 'Unnamed Bot'): void {
  const now = new Date().toISOString();
  const botExistsStmt = db.prepare('SELECT Id FROM Bots WHERE Id = ?');
  if (!botExistsStmt.get(botId)) {
    db.prepare(
      'INSERT INTO Bots (Id, Name, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?)'
    ).run(botId, name, now, now);
  } else {
    db.prepare('UPDATE Bots SET UpdatedAt = ? WHERE Id = ?')
      .run(now, botId);
  }
}

function saveNode(
  botId: string,
  node: Node
): { success: boolean; nodeId?: string; error?: string } {
  const now = new Date().toISOString();
  try {
    db.transaction(() => {
      ensureBotExists(botId);
      const definition = JSON.stringify({ type: node.type, properties: node.properties });
      db.prepare(`
        INSERT INTO Nodes (BotId, NodeId, Definition, CreatedAt, UpdatedAt)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(BotId, NodeId) DO UPDATE SET
          Definition = excluded.Definition,
          UpdatedAt  = excluded.UpdatedAt
      `).run(botId, node.id, definition, now, now);
    })();
    return { success: true, nodeId: node.id };
  } catch (err) {
    console.error('Error saving node:', err);
    return { success: false, error: (err as Error).message };
  }
}

function saveAllNodes(
  botId: string,
  nodes: Node[]
): { success: boolean; error?: string } {
  const now = new Date().toISOString();
  try {
    ensureBotExists(botId);
    const stmt = db.prepare(`
      INSERT INTO Nodes (BotId, NodeId, Definition, CreatedAt, UpdatedAt)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(BotId, NodeId) DO UPDATE SET
        Definition = excluded.Definition,
        UpdatedAt  = excluded.UpdatedAt
    `);

    db.transaction((all: Node[]) => {
      for (const node of all) {
        const definition = JSON.stringify({
          type: node.type,
          properties: node.properties,
        });
        stmt.run(botId, node.id, definition, now, now);
      }
    })(nodes);

    return { success: true };
  } catch (err) {
    console.error('Error saving all nodes:', err);
    return { success: false, error: (err as Error).message };
  }
}

function closeDB(): void {
  if (db && db.open) {
    db.close();
    console.log('Database connection closed.');
  }
}

app.whenReady()
  .then(() => {
    initDatabase();
    // ...create windows, menus, etc.
  })
  .catch(err => {
    console.error('Initialization error:', err);
    app.quit();
  });

// Ensure we close DB on quit
app.on('before-quit', closeDB);

export { saveNode, saveAllNodes, closeDB as close, initDatabase };
