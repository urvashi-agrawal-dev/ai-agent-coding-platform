import { spawn } from 'child_process';

export class SandboxExecutor {
  async execute(code: string, language: string, input?: string) {
    const timeout = parseInt(process.env.SANDBOX_TIMEOUT || '30000');
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      let output = '';
      let error = '';

      // Simple execution - in production, use Docker or VM isolation
      const process = spawn(this.getCommand(language), this.getArgs(language, code));
      
      if (input) process.stdin.write(input);
      process.stdin.end();

      process.stdout.on('data', (data) => output += data.toString());
      process.stderr.on('data', (data) => error += data.toString());

      const timer = setTimeout(() => {
        process.kill();
        resolve({ output, error: 'Execution timeout', executionTime: timeout });
      }, timeout);

      process.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          output,
          error,
          exitCode: code,
          executionTime: Date.now() - startTime
        });
      });
    });
  }

  private getCommand(language: string): string {
    const commands: Record<string, string> = {
      javascript: 'node',
      python: 'python',
      typescript: 'ts-node'
    };
    return commands[language] || 'node';
  }

  private getArgs(language: string, code: string): string[] {
    return ['-e', code];
  }
}
