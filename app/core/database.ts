import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';
import { Node, Connection, NodeProperties } from './base';

const dbPath = path.join(app.getPath('userData'), 'visualBotCrafter.db');
let db: Database.Database;

function initDatabase(): void {
  db = new Database(dbPath);
  db.exec(`
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
      PRIMARY KEY (BotId, NodeId),
      FOREIGN KEY (BotId) REFERENCES Bots(Id) ON DELETE CASCADE
    );
  `); // more tables to come like job queue and environment variables.
  console.log('Database initialized successfully at:', dbPath);
}

function ensureBotExists(botId: string, name: string = 'Unnamed Bot'): void {
  const now = new Date().toISOString();
  const botExistsStmt = db.prepare('SELECT Id FROM Bots WHERE Id = ?');
  const existingBot = botExistsStmt.get(botId);
  if (!existingBot) {
    const insertBotStmt = db.prepare('INSERT INTO Bots (Id, Name, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?)');
    insertBotStmt.run(botId, name, now, now);
  } else {
    const updateBotStmt = db.prepare('UPDATE Bots SET UpdatedAt = ? WHERE Id = ?');
    updateBotStmt.run(now, botId);
  }
}

function saveNode(botId: string, node: Node): { success: boolean; nodeId?: string; error?: string } {
  const now = new Date().toISOString();

  try {
    db.transaction(() => {
      // Ensure the bot exists before saving the node
      ensureBotExists(botId);

      // Upsert node for the given botId and node.id
      const definition = JSON.stringify({ type: node.type, properties: node.properties });
      const upsertNodeStmt = db.prepare(`
        INSERT INTO Nodes (BotId, NodeId, Definition, CreatedAt)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(BotId, NodeId) DO UPDATE SET
          Definition = excluded.Definition,
          CreatedAt = Nodes.CreatedAt
      `);
      upsertNodeStmt.run(botId, node.id, definition, now);
    })();
    return { success: true, nodeId: node.id };
  } catch (err) {
    console.error('Error saving node:', err);
    return { success: false, error: (err as Error).message };
  }
}

function close(): void {
  if (db && db.open) {
    db.close();
    console.log('Database connection closed.');
  }
}

initDatabase();

// security measure for data corruption
app.on('before-quit', () => {
  close();
});

export {
  saveNode,
  close,
};
