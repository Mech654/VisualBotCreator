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

  constructor(
    id: string,
    properties: Partial<TerminalNodeProperties> = {},
    position: { x: number; y: number } = { x: 0, y: 0 }
  ) {
    const terminalProps: TerminalNodeProperties = {
      command:
        typeof properties.command === 'string' && properties.command.trim() !== ''
          ? properties.command
          : '',
      workingDirectory:
        typeof properties.workingDirectory === 'string' && properties.workingDirectory.trim() !== ''
          ? properties.workingDirectory
          : '',
      platform: properties.platform || 'auto',
      language:
        typeof properties.language === 'string' && properties.language.trim() !== ''
          ? properties.language
          : 'JavaScript',
    };

    terminalProps.nodeContent = generateTerminalPreview(terminalProps);
    super(id, 'terminal', terminalProps, position);

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

  updateNodeContent(): string {
    const terminalProps = this.properties as TerminalNodeProperties;
    this.properties.nodeContent = generateTerminalPreview(terminalProps);
    return this.properties.nodeContent as string;
  }
}

function generateTerminalPreview(properties: TerminalNodeProperties): string {
  const command =
    typeof properties.command === 'string' && properties.command.trim() !== ''
      ? properties.command
      : 'No command';
  const workingDirectory =
    typeof properties.workingDirectory === 'string' && properties.workingDirectory.trim() !== ''
      ? properties.workingDirectory
      : 'Default directory';
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
