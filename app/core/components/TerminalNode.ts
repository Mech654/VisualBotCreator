import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface TerminalNodeProperties extends NodeProperties {
  command?: string;
  workingDirectory?: string;
  platform?: 'linux' | 'windows' | 'auto';
  nodeContent?: string;
  title?: string;
  language?: string;
}

export class TerminalNode extends Node {
  static metadata = {
    name: 'Terminal',
    category: ComponentCategory.DATA,
    description: 'Execute terminal commands on Linux and Windows',
    flowType: 'data',
    icon: '💻',
  };

  static override shownProperties = ['command', 'workingDirectory'];

  constructor(id: string, properties: Partial<TerminalNodeProperties> = {}) {
    const terminalProps: TerminalNodeProperties = {
      command: properties.command || '',
      workingDirectory: properties.workingDirectory || '',
      platform: properties.platform || 'auto',
      language: properties.language || 'JavaScript',
    };

    terminalProps.nodeContent = generateTerminalPreview(terminalProps);
    super(id, 'terminal', terminalProps);

    // Flow control ports
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));

    // Data input ports
    this.addInput(new Port('command', 'Command', 'string', 'command'));
    this.addInput(new Port('workingDirectory', 'Working Directory', 'string', 'directory'));
    this.addInput(new Port('platform', 'Platform', 'string', 'platform'));

    // Data output ports
    this.addOutput(new Port('output', 'Output', 'string', 'result'));
    this.addOutput(new Port('exitCode', 'Exit Code', 'number', 'code'));
    this.addOutput(new Port('status', 'Status', 'boolean', 'success'));
  }

  updateNodeContent() {
    const terminalProps = this.properties as TerminalNodeProperties;
    this.properties.nodeContent = generateTerminalPreview(terminalProps);
    return this.properties.nodeContent;
  }

  process(inputValues: Record<string, any>): Record<string, any> {
    const command = inputValues['command'] || this.properties.command;
    const workingDirectory = inputValues['workingDirectory'] || this.properties.workingDirectory;
    const platform = inputValues['platform'] || this.properties.platform;

    // Execute terminal command
    let output = '';
    let exitCode = 0;
    let status = true;

    try {
      if (!command) {
        output = 'Error: No command specified';
        exitCode = 1;
        status = false;
      } else {
        // Determine platform
        const detectedPlatform = platform === 'auto' ? this.detectPlatform() : platform;
        
        // Process command based on platform
        const processedCommand = this.processCommandForPlatform(command, detectedPlatform);
        
        // Execute command (this would call the actual process execution)
        // For now, simulate execution
        output = `[${detectedPlatform.toUpperCase()}] Executed: ${processedCommand}`;
        if (workingDirectory) {
          output += `\nWorking Directory: ${workingDirectory}`;
        }
        output += '\nCommand completed successfully.';
        exitCode = 0;
        status = true;
      }

    } catch (error) {
      output = `Error executing command: ${error}`;
      exitCode = 1;
      status = false;
    }

    return {
      output,
      exitCode,
      status,
    };
  }

  private detectPlatform(): 'linux' | 'windows' {
    // In a real implementation, this would detect the actual platform
    // For now, return based on common indicators
    return process.platform === 'win32' ? 'windows' : 'linux';
  }

  private processCommandForPlatform(command: string, platform: 'linux' | 'windows'): string {
    if (platform === 'windows') {
      // Convert common Linux commands to Windows equivalents
      return command
        .replace(/^ls\b/, 'dir')
        .replace(/^cat\b/, 'type')
        .replace(/^rm\b/, 'del')
        .replace(/^mv\b/, 'move')
        .replace(/^cp\b/, 'copy')
        .replace(/^pwd\b/, 'cd')
        .replace(/^clear\b/, 'cls')
        .replace(/^which\b/, 'where')
        .replace(/^grep\b/, 'findstr')
        .replace(/\//g, '\\'); // Convert forward slashes to backslashes
    } else {
      // Convert common Windows commands to Linux equivalents
      return command
        .replace(/^dir\b/, 'ls')
        .replace(/^type\b/, 'cat')
        .replace(/^del\b/, 'rm')
        .replace(/^move\b/, 'mv')
        .replace(/^copy\b/, 'cp')
        .replace(/^cls\b/, 'clear')
        .replace(/^where\b/, 'which')
        .replace(/^findstr\b/, 'grep')
        .replace(/\\/g, '/'); // Convert backslashes to forward slashes
    }
  }
}

function generateTerminalPreview(properties: TerminalNodeProperties): string {
  const command = properties.command || 'No command';
  const workingDirectory = properties.workingDirectory || 'Default directory';
  const platform = properties.platform || 'auto';

  // Truncate command for display
  let displayCommand = command;
  if (displayCommand.length > 25) {
    displayCommand = displayCommand.substring(0, 22) + '...';
  }

  // Truncate working directory for display
  let displayDir = workingDirectory;
  if (displayDir.length > 20) {
    displayDir = '...' + displayDir.substring(displayDir.length - 17);
  }

  // Escape HTML
  displayCommand = displayCommand
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  displayDir = displayDir
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const platformIcon = platform === 'windows' ? '🪟' : platform === 'linux' ? '🐧' : '🖥️';

  return `
    <div class="terminal-preview" style="
      padding: 8px;
      border-radius: 4px;
      background: linear-gradient(135deg, #2c3e50, #34495e);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.3;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
      <div style="display: flex; align-items: center; margin-bottom: 4px;">
        <span style="font-size: 16px; margin-right: 6px;">${platformIcon}</span>
        <strong style="color: white;">Terminal</strong>
      </div>
      <div style="font-size: 10px; opacity: 0.9; color: #ecf0f1;">
        <div style="margin-bottom: 2px;">$ ${displayCommand}</div>
        <div style="margin-bottom: 2px;">📁 ${displayDir}</div>
        <div>🖥️ ${platform}</div>
      </div>
    </div>
  `;
}
