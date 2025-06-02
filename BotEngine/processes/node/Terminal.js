import { BaseProcessor } from './BaseProcessor.js';
import { execSync } from 'child_process';

class TerminalProcessor extends BaseProcessor {
  process(properties) {
    let command = this.getProperty(properties, 'command');
    const workingDirectory = this.getProperty(properties, 'workingDirectory');

    if (!command) {
      return {
        output: 'Error: No command specified',
        exitCode: 1,
        status: false,
      };
    }

    command = this.substituteVariables(command, properties);

    const execOptions = {};
    if (workingDirectory) {
      execOptions.cwd = workingDirectory;
    }

    return this.executeCommand(command, execOptions);
  }

  substituteVariables(command, properties) {
    return command.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      const value = properties[variableName];
      if (value !== undefined && value !== null) {
        return String(value);
      }
      return match;
    });
  }

  executeCommand(command, options = {}) {
    const platform = this.detectPlatform();

    const defaultOptions = {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 1024 * 1024,
      ...options,
    };

    let finalCommand = command;
    if (platform === 'windows') {
      if (!command.startsWith('cmd /c') && !command.startsWith('powershell')) {
        finalCommand = `cmd /c "${command}"`;
      }
      defaultOptions.shell = true;
    } else {
      defaultOptions.shell = '/bin/bash';
    }

    try {
      const output = execSync(finalCommand, defaultOptions);
      return {
        output: output.toString().trim(),
        exitCode: 0,
        status: true,
      };
    } catch (execError) {
      return {
        output: execError.stderr || execError.stdout || execError.message,
        exitCode: execError.status || 1,
        status: false,
      };
    }
  }
}

new TerminalProcessor();
