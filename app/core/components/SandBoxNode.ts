import { Node, Port, NodeProperties } from '../base.js';
import { ComponentCategory } from '../nodeSystem.js';
import { VM, VMOptions } from 'vm2';

export interface SandBoxNodeProperties extends NodeProperties {
  jsCode?: string;
  nodeContent?: string;
  title?: string;
  language?: string;
}

export class SandBoxNode extends Node {
  static metadata = {
    name: 'SandBox',
    category: ComponentCategory.DATA,
    description: 'JavaScript code execution sandbox',
    flowType: 'data',
    icon: '🧪',
  };

  static override shownProperties = ['jsCode'];

  constructor(id: string, properties: Partial<SandBoxNodeProperties> = {}) {
    const sandBoxProps: SandBoxNodeProperties = {
      jsCode:
        properties.jsCode !== undefined && properties.jsCode !== null
          ? properties.jsCode
          : 'return input1 + input2;',
      language:
        properties.language !== undefined && properties.language !== null
          ? properties.language
          : 'JavaScript',
    };

    sandBoxProps.nodeContent = generateSandBoxPreview(sandBoxProps);
    super(id, 'sandbox', sandBoxProps);

    // Flow control ports
    this.addInput(new Port('previous', 'Previous', 'control'));
    this.addOutput(new Port('next', 'Next', 'control'));

    // Data input ports
    this.addInput(new Port('jsCode', 'JS Code', 'string', 'code'));
    this.addInput(new Port('input1', 'Input 1', 'any', 'value'));
    this.addInput(new Port('input2', 'Input 2', 'any', 'value'));
    this.addInput(new Port('input3', 'Input 3', 'any', 'value'));
    this.addInput(new Port('input4', 'Input 4', 'any', 'value'));
    this.addInput(new Port('input5', 'Input 5', 'any', 'value'));

    // Data output ports
    this.addOutput(new Port('result', 'Result', 'any', 'result'));
    this.addOutput(new Port('status', 'Status', 'boolean', 'success'));
  }

  updateNodeContent(): string {
    const sandBoxProps = this.properties as SandBoxNodeProperties;
    this.properties.nodeContent = generateSandBoxPreview(sandBoxProps);
    return this.properties.nodeContent as string;
  }

  process(inputValues: Record<string, unknown>): Record<string, unknown> {
    const jsCode: string =
      typeof inputValues['jsCode'] === 'string'
        ? inputValues['jsCode']
        : typeof this.properties.jsCode === 'string'
          ? this.properties.jsCode
          : '';
    const input1: unknown = inputValues['input1'];
    const input2: unknown = inputValues['input2'];
    const input3: unknown = inputValues['input3'];
    const input4: unknown = inputValues['input4'];
    const input5: unknown = inputValues['input5'];

    let result: unknown = null;
    let status = true;

    try {
      if (!jsCode) {
        result = 'Error: No JavaScript code provided';
        status = false;
      } else {
        // Create a safe execution context with explicit type casting
        const options: VMOptions = {
          timeout: 1000,
          sandbox: {
            input1,
            input2,
            input3,
            input4,
            input5,
            Math,
            String,
            Number,
            Boolean,
            Array,
            Object,
            JSON,
            Date,
            RegExp,
          },
        };
        const vmInstance = new VM(options);

        // Wrap user code in a function for argument passing
        const wrappedCode = `
          (function(input1, input2, input3, input4, input5, Math, String, Number, Boolean, Array, Object, JSON, Date, RegExp, console) {
            ${jsCode}
          })(input1, input2, input3, input4, input5, Math, String, Number, Boolean, Array, Object, JSON, Date, RegExp, undefined)
        `;

        result = vmInstance.run(wrappedCode);

        status = true;
      }
    } catch (error) {
      let errorMsg = 'Unknown error';
      if (typeof error === 'string') {
        errorMsg = error;
      } else if (
        error !== null &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        errorMsg = (error as { message: string }).message;
      }
      result = `JavaScript Error: ${errorMsg}`;
      status = false;
    }

    return {
      result,
      status,
    };
  }
}

function generateSandBoxPreview(properties: SandBoxNodeProperties): string {
  const jsCode =
    properties.jsCode !== undefined && properties.jsCode !== null ? properties.jsCode : 'No code';

  // Truncate code for display
  let displayCode = jsCode;
  if (displayCode.length > 40) {
    displayCode = displayCode.substring(0, 37) + '...';
  }

  // Escape HTML
  displayCode = displayCode
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, ' '); // Replace newlines with spaces for preview

  return `
    <div class="sandbox-preview" style="
      padding: 8px;
      border-radius: 4px;
      background: linear-gradient(135deg, #8e44ad, #9b59b6);
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.3;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
      <div style="display: flex; align-items: center; margin-bottom: 4px;">
        <span style="font-size: 16px; margin-right: 6px;">🧪</span>
        <strong style="font-family: sans-serif;">JS SandBox</strong>
      </div>
      <div style="font-size: 10px; opacity: 0.9; color: #ecf0f1;">
        <div style="margin-bottom: 2px;">📝 ${displayCode}</div>
        <div style="display: flex; gap: 8px; font-size: 8px;">
          <span>🔗 5 inputs</span>
          <span>📤 1 output</span>
        </div>
      </div>
    </div>
  `;
}
