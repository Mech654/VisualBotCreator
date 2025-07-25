
import net from 'net';
import { EventEmitter } from 'events';


/**
 * DebugBridge: TCP client for communicating with the C# Debugger backend.
 * Emits: 'connected', 'disconnected', 'message', 'error'
 */
export class DebugBridge extends EventEmitter {
  private port: number;
  private host: string;
  private client: net.Socket | null = null;
  private buffer = '';

  constructor(port = 5000, host = '127.0.0.1') {
    super();
    this.port = port;
    this.host = host;
  }

  /**
   * Connect to the C# TCP debugger.
   */
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

  /**
   * Send a JSON object to the C# debugger.
   */
  send(obj: unknown): void {
    if (this.client && this.client.writable) {
      this.client.write(JSON.stringify(obj) + '\n');
    }
  }

  /**
   * Disconnect from the C# debugger.
   */
  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}
