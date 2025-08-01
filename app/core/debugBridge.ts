import net from 'net';
import { EventEmitter } from 'events';
import { BrowserWindow } from 'electron';

export class DebugBridge extends EventEmitter {
  private port: number;
  private host: string;
  private client: net.Socket | null = null;
  private buffer = '';

  constructor(port = 5000, host = '127.0.0.1') {
    super();
    this.port = 5001;
    this.host = host;
    this.setup();
  }

  setup(): void {
    this.connect();
    this.on('connected', () => {
      console.log('[DebugBridge] Connected to C# Debugger');
    });
    this.on('message', (msg) => {
      console.log('[DebugBridge] Message from C#:', msg);
      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('debug:message', msg);
      });
    });
    this.on('error', (err) => {
      console.error('[DebugBridge] Error:', err);
    });
  }

  connect(): void {
    this.client = new net.Socket();
    this.client.connect(this.port, this.host, () => {
      this.emit('connected');
    });

    this.client.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim()) {
          try {
            const msg = JSON.parse(line);
            this.emit('message', msg);
          } catch (e) {
            this.emit('error', new Error('Invalid JSON from C# Debugger: ' + line));
          }
        }
      }
    });

    this.client.on('close', () => {
      this.emit('disconnected');
    });

    this.client.on('error', (err: Error) => {
      this.emit('error', err);
    });
  }

  send(obj: unknown): void {
    if (this.client && this.client.writable) {
      this.client.write(JSON.stringify(obj) + '\n');
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}
