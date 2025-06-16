import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';

export interface PdfEditorNodeProperties extends NodeProperties {
  pdfPath?: string;
  newText?: string;
  locator?: string;
  nodeContent?: string;
  title?: string;
  language?: string;
}

export class PdfEditorNode extends Node {
  static metadata = {
    name: 'PDF Editor',
    category: ComponentCategory.DATA,
    description: 'PDF editing and manipulation node',
    flowType: 'data',
    icon: '📄',
  };

  static override shownProperties = ['pdfPath', 'newText', 'locator'];

  constructor(id: string, properties: Partial<PdfEditorNodeProperties> = {}) {
    const pdfEditorProps: PdfEditorNodeProperties = {
      pdfPath: properties.pdfPath ?? '',
      newText: properties.newText ?? '',
      locator:
        typeof properties.locator === 'string' && properties.locator.length > 0
          ? properties.locator
          : '',
      language:
        typeof properties.language === 'string' && properties.language.trim().length > 0
          ? properties.language
          : 'JavaScript',
    };

    pdfEditorProps.nodeContent = generatePdfEditorPreview(pdfEditorProps);
    super(id, 'pdfeditor', pdfEditorProps);

    // Flow control ports
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));

    // Data input ports
    this.addInput(new Port('pdfPath', 'PDF Path', 'string', 'file'));
    this.addInput(new Port('newText', 'New Text', 'string', 'text'));
    this.addInput(new Port('locator', 'Locator', 'string', 'locator'));

    // Data output ports
    this.addOutput(new Port('status', 'Status', 'boolean', 'success'));
  }

  updateNodeContent(): string {
    const pdfProps = this.properties as PdfEditorNodeProperties;
    this.properties.nodeContent = generatePdfEditorPreview(pdfProps);
    return this.properties.nodeContent as string;
  }
}

function generatePdfEditorPreview(properties: PdfEditorNodeProperties): string {
  const pdfPath =
    typeof properties.pdfPath === 'string' && properties.pdfPath.trim().length > 0
      ? properties.pdfPath
      : 'No file selected';
  const newText =
    typeof properties.newText === 'string' && properties.newText.trim().length > 0
      ? properties.newText
      : 'No text specified';
  const locator =
    typeof properties.locator === 'string' && properties.locator.trim().length > 0
      ? properties.locator
      : 'No locator';

  // Truncate file path for display
  let displayPath = pdfPath;
  if (displayPath.length > 30) {
    displayPath = '...' + displayPath.substring(displayPath.length - 27);
  }

  // Truncate new text for display
  let displayText = newText;
  if (displayText.length > 20) {
    displayText = displayText.substring(0, 17) + '...';
  }

  // Escape HTML
  displayPath = displayPath
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  displayText = displayText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return `
    <div class="pdf-editor-preview" style="
      padding: 8px;
      border-radius: 4px;
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      color: white;
      font-size: 12px;
      line-height: 1.3;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="display: flex; align-items: center; margin-bottom: 4px;">
        <span style="font-size: 16px; margin-right: 6px;">📝</span>
        <strong>PDF Text Editor</strong>
      </div>
      <div style="font-size: 10px; opacity: 0.9;">
        <div style="margin-bottom: 2px;">📁 ${displayPath}</div>
        <div style="margin-bottom: 2px;">📝 "${displayText}"</div>
        <div>🎯 @ ${locator}</div>
      </div>
    </div>
  `;
}
