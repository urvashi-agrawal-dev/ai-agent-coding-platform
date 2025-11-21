import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  executionTime: number;
  language: string;
}

export interface ExecutionRequest {
  code: string;
  language: string;
  input?: string;
  timeout?: number;
}

export class CodeExecutor {
  private tempDir = path.join(process.cwd(), '.temp-execution');
  private defaultTimeout = 30000; // 30 seconds

  constructor() {
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const { code, language, input, timeout = this.defaultTimeout } = request;
    const startTime = Date.now();

    try {
      switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
          return await this.executeJavaScript(code, input, timeout, startTime);
        case 'python':
        case 'py':
          return await this.executePython(code, input, timeout, startTime);
        case 'java':
          return await this.executeJava(code, input, timeout, startTime);
        case 'c':
          return await this.executeC(code, input, timeout, startTime);
        case 'cpp':
        case 'c++':
          return await this.executeCpp(code, input, timeout, startTime);
        default:
          return {
            success: false,
            output: '',
            error: `Unsupported language: ${language}`,
            executionTime: Date.now() - startTime,
            language
          };
      }
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime,
        language
      };
    }
  }

  private async executeJavaScript(
    code: string,
    input: string | undefined,
    timeout: number,
    startTime: number
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      let output = '';
      let error = '';

      const process = spawn('node', ['-e', code]);

      if (input) {
        process.stdin.write(input);
        process.stdin.end();
      }

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      const timer = setTimeout(() => {
        process.kill();
        resolve({
          success: false,
          output,
          error: 'Execution timeout exceeded',
          executionTime: timeout,
          language: 'javascript'
        });
      }, timeout);

      process.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          success: code === 0,
          output,
          error,
          executionTime: Date.now() - startTime,
          language: 'javascript'
        });
      });

      process.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          output,
          error: err.message,
          executionTime: Date.now() - startTime,
          language: 'javascript'
        });
      });
    });
  }

  private async executePython(
    code: string,
    input: string | undefined,
    timeout: number,
    startTime: number
  ): Promise<ExecutionResult> {
    const filename = path.join(this.tempDir, `${uuidv4()}.py`);
    
    try {
      fs.writeFileSync(filename, code);

      return new Promise((resolve) => {
        let output = '';
        let error = '';

        const process = spawn('python', [filename]);

        if (input) {
          process.stdin.write(input);
          process.stdin.end();
        }

        process.stdout.on('data', (data) => {
          output += data.toString();
        });

        process.stderr.on('data', (data) => {
          error += data.toString();
        });

        const timer = setTimeout(() => {
          process.kill();
          this.cleanup(filename);
          resolve({
            success: false,
            output,
            error: 'Execution timeout exceeded',
            executionTime: timeout,
            language: 'python'
          });
        }, timeout);

        process.on('close', (code) => {
          clearTimeout(timer);
          this.cleanup(filename);
          resolve({
            success: code === 0,
            output,
            error,
            executionTime: Date.now() - startTime,
            language: 'python'
          });
        });

        process.on('error', (err) => {
          clearTimeout(timer);
          this.cleanup(filename);
          resolve({
            success: false,
            output,
            error: err.message,
            executionTime: Date.now() - startTime,
            language: 'python'
          });
        });
      });
    } catch (error: any) {
      this.cleanup(filename);
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime,
        language: 'python'
      };
    }
  }

  private async executeJava(
    code: string,
    input: string | undefined,
    timeout: number,
    startTime: number
  ): Promise<ExecutionResult> {
    // Extract class name from code
    const classNameMatch = code.match(/public\s+class\s+(\w+)/);
    if (!classNameMatch) {
      return {
        success: false,
        output: '',
        error: 'No public class found in Java code',
        executionTime: Date.now() - startTime,
        language: 'java'
      };
    }

    const className = classNameMatch[1];
    const filename = path.join(this.tempDir, `${className}.java`);
    const classFile = path.join(this.tempDir, `${className}.class`);

    try {
      fs.writeFileSync(filename, code);

      // Compile
      const compileResult = await this.runCommand('javac', [filename], timeout);
      if (!compileResult.success) {
        this.cleanup(filename, classFile);
        return {
          success: false,
          output: compileResult.output,
          error: compileResult.error || 'Compilation failed',
          executionTime: Date.now() - startTime,
          language: 'java'
        };
      }

      // Execute
      return new Promise((resolve) => {
        let output = '';
        let error = '';

        const process = spawn('java', ['-cp', this.tempDir, className]);

        if (input) {
          process.stdin.write(input);
          process.stdin.end();
        }

        process.stdout.on('data', (data) => {
          output += data.toString();
        });

        process.stderr.on('data', (data) => {
          error += data.toString();
        });

        const timer = setTimeout(() => {
          process.kill();
          this.cleanup(filename, classFile);
          resolve({
            success: false,
            output,
            error: 'Execution timeout exceeded',
            executionTime: timeout,
            language: 'java'
          });
        }, timeout);

        process.on('close', (code) => {
          clearTimeout(timer);
          this.cleanup(filename, classFile);
          resolve({
            success: code === 0,
            output,
            error,
            executionTime: Date.now() - startTime,
            language: 'java'
          });
        });

        process.on('error', (err) => {
          clearTimeout(timer);
          this.cleanup(filename, classFile);
          resolve({
            success: false,
            output,
            error: err.message,
            executionTime: Date.now() - startTime,
            language: 'java'
          });
        });
      });
    } catch (error: any) {
      this.cleanup(filename, classFile);
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime,
        language: 'java'
      };
    }
  }

  private async executeC(
    code: string,
    input: string | undefined,
    timeout: number,
    startTime: number
  ): Promise<ExecutionResult> {
    const sourceFile = path.join(this.tempDir, `${uuidv4()}.c`);
    const outputFile = path.join(this.tempDir, `${uuidv4()}.out`);

    try {
      fs.writeFileSync(sourceFile, code);

      // Compile
      const compileResult = await this.runCommand('gcc', [sourceFile, '-o', outputFile], timeout);
      if (!compileResult.success) {
        this.cleanup(sourceFile, outputFile);
        return {
          success: false,
          output: compileResult.output,
          error: compileResult.error || 'Compilation failed',
          executionTime: Date.now() - startTime,
          language: 'c'
        };
      }

      // Execute
      return new Promise((resolve) => {
        let output = '';
        let error = '';

        const process = spawn(outputFile);

        if (input) {
          process.stdin.write(input);
          process.stdin.end();
        }

        process.stdout.on('data', (data) => {
          output += data.toString();
        });

        process.stderr.on('data', (data) => {
          error += data.toString();
        });

        const timer = setTimeout(() => {
          process.kill();
          this.cleanup(sourceFile, outputFile);
          resolve({
            success: false,
            output,
            error: 'Execution timeout exceeded',
            executionTime: timeout,
            language: 'c'
          });
        }, timeout);

        process.on('close', (code) => {
          clearTimeout(timer);
          this.cleanup(sourceFile, outputFile);
          resolve({
            success: code === 0,
            output,
            error,
            executionTime: Date.now() - startTime,
            language: 'c'
          });
        });

        process.on('error', (err) => {
          clearTimeout(timer);
          this.cleanup(sourceFile, outputFile);
          resolve({
            success: false,
            output,
            error: err.message,
            executionTime: Date.now() - startTime,
            language: 'c'
          });
        });
      });
    } catch (error: any) {
      this.cleanup(sourceFile, outputFile);
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime,
        language: 'c'
      };
    }
  }

  private async executeCpp(
    code: string,
    input: string | undefined,
    timeout: number,
    startTime: number
  ): Promise<ExecutionResult> {
    const sourceFile = path.join(this.tempDir, `${uuidv4()}.cpp`);
    const outputFile = path.join(this.tempDir, `${uuidv4()}.out`);

    try {
      fs.writeFileSync(sourceFile, code);

      // Compile
      const compileResult = await this.runCommand('g++', [sourceFile, '-o', outputFile], timeout);
      if (!compileResult.success) {
        this.cleanup(sourceFile, outputFile);
        return {
          success: false,
          output: compileResult.output,
          error: compileResult.error || 'Compilation failed',
          executionTime: Date.now() - startTime,
          language: 'cpp'
        };
      }

      // Execute
      return new Promise((resolve) => {
        let output = '';
        let error = '';

        const process = spawn(outputFile);

        if (input) {
          process.stdin.write(input);
          process.stdin.end();
        }

        process.stdout.on('data', (data) => {
          output += data.toString();
        });

        process.stderr.on('data', (data) => {
          error += data.toString();
        });

        const timer = setTimeout(() => {
          process.kill();
          this.cleanup(sourceFile, outputFile);
          resolve({
            success: false,
            output,
            error: 'Execution timeout exceeded',
            executionTime: timeout,
            language: 'cpp'
          });
        }, timeout);

        process.on('close', (code) => {
          clearTimeout(timer);
          this.cleanup(sourceFile, outputFile);
          resolve({
            success: code === 0,
            output,
            error,
            executionTime: Date.now() - startTime,
            language: 'cpp'
          });
        });

        process.on('error', (err) => {
          clearTimeout(timer);
          this.cleanup(sourceFile, outputFile);
          resolve({
            success: false,
            output,
            error: err.message,
            executionTime: Date.now() - startTime,
            language: 'cpp'
          });
        });
      });
    } catch (error: any) {
      this.cleanup(sourceFile, outputFile);
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime,
        language: 'cpp'
      };
    }
  }

  private runCommand(command: string, args: string[], timeout: number): Promise<{ success: boolean; output: string; error: string }> {
    return new Promise((resolve) => {
      let output = '';
      let error = '';

      const process = spawn(command, args);

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      const timer = setTimeout(() => {
        process.kill();
        resolve({ success: false, output, error: 'Command timeout' });
      }, timeout);

      process.on('close', (code) => {
        clearTimeout(timer);
        resolve({ success: code === 0, output, error });
      });

      process.on('error', (err) => {
        clearTimeout(timer);
        resolve({ success: false, output, error: err.message });
      });
    });
  }

  private cleanup(...files: string[]) {
    files.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  }
}
