import os from 'os';

export class BaseProcessor {
  constructor() {
    this.inputData = '';
    this.setupStdinHandling();
  }

  setupStdinHandling() {
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', chunk => {
      this.inputData += chunk;
    });

    process.stdin.on('end', () => {
      try {
        const properties = JSON.parse(this.inputData.trim());
        const result = this.process(properties);
        this.sendResult(result);
      } catch (error) {
        this.sendError(`Error parsing input: ${error.message}`);
      }
    });
  }

  process(properties) {
    throw new Error('process() method must be implemented by child class');
  }

  sendResult(result) {
    console.log(JSON.stringify(result));
  }

  sendError(errorMessage, exitCode = 1) {
    const errorResult = {
      output: errorMessage,
      exitCode,
      status: false,
    };
    console.log(JSON.stringify(errorResult));
  }

  detectPlatform() {
    switch (process.platform) {
      case 'win32':
        return 'windows';
      case 'darwin':
        return 'macos';
      case 'linux':
        return 'linux';
      case 'freebsd':
      case 'openbsd':
      case 'sunos':
      case 'aix':
        return 'unix';
      default:
        return 'unknown';
    }
  }

  validateRequired(properties, requiredProps) {
    for (const prop of requiredProps) {
      if (!properties[prop]) {
        throw new Error(`Required property '${prop}' is missing or empty`);
      }
    }
  }

  getProperty(properties, key, defaultValue = '') {
    return properties[key] || defaultValue;
  }
}
