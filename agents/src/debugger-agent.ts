import { AgentRequest, AgentResponse, AgentType, DebugReport, DebugIssue } from '../../shared/src/types';
import { spawn } from 'child_process';

interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  stackTrace?: StackTrace;
  exitCode: number;
  executionTime: number;
}

interface StackTrace {
  message: string;
  type: string;
  stack: StackFrame[];
}

interface StackFrame {
  file: string;
  line: number;
  column: number;
  function: string;
}

interface RootCauseAnalysis {
  errorType: string;
  explanation: string;
  rootCause: string;
  suggestedFix: string;
  patchedCode?: string;
  confidence: number;
}

export class DebuggerAgent {
  private timeout = 30000; // 30 seconds

  async process(request: AgentRequest): Promise<AgentResponse> {
    const language = request.context?.language || 'javascript';
    const autoFix = request.context?.autoFix || false;
    
    // Run code in sandbox
    const executionResult = await this.runInSandbox(request.code, language);
    
    // Perform static analysis
    const staticIssues = this.performStaticAnalysis(request.code);
    
    // Analyze runtime errors if any
    let rootCauseAnalysis: RootCauseAnalysis | null = null;
    if (!executionResult.success && executionResult.stackTrace) {
      rootCauseAnalysis = this.analyzeRootCause(
        request.code,
        executionResult.stackTrace,
        executionResult.error
      );
      
      // Auto-patch if requested and confidence is high
      if (autoFix && rootCauseAnalysis.confidence > 0.7) {
        rootCauseAnalysis.patchedCode = this.generatePatch(
          request.code,
          rootCauseAnalysis
        );
      }
    }
    
    // Combine all issues
    const allIssues = this.combineIssues(staticIssues, executionResult, rootCauseAnalysis);
    
    const report: DebugReport = {
      issues: allIssues,
      severity: this.calculateSeverity(allIssues),
      timestamp: new Date()
    };

    return {
      agentType: AgentType.DEBUGGER,
      success: true,
      data: {
        report,
        executionResult,
        rootCauseAnalysis,
        staticAnalysis: staticIssues
      },
      errors: allIssues.filter(i => i.type === 'error').map(i => i.message),
      timestamp: new Date()
    };
  }

  private async runInSandbox(code: string, language: string): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let output = '';
      let error = '';
      let stackTrace: StackTrace | undefined;

      const { command, args } = this.getExecutionCommand(language, code);
      const process = spawn(command, args);

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
          error: 'Execution timeout - process took longer than 30 seconds',
          exitCode: -1,
          executionTime: this.timeout
        });
      }, this.timeout);

      process.on('close', (exitCode) => {
        clearTimeout(timer);
        
        // Parse stack trace if error occurred
        if (error && exitCode !== 0) {
          stackTrace = this.parseStackTrace(error, language);
        }

        resolve({
          success: exitCode === 0,
          output,
          error,
          stackTrace,
          exitCode: exitCode || 0,
          executionTime: Date.now() - startTime
        });
      });

      process.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          output,
          error: err.message,
          exitCode: -1,
          executionTime: Date.now() - startTime
        });
      });
    });
  }

  private getExecutionCommand(language: string, code: string): { command: string; args: string[] } {
    const commands: Record<string, { command: string; args: string[] }> = {
      javascript: { command: 'node', args: ['-e', code] },
      typescript: { command: 'ts-node', args: ['-e', code] },
      python: { command: 'python', args: ['-c', code] }
    };

    return commands[language] || commands.javascript;
  }

  private parseStackTrace(errorOutput: string, language: string): StackTrace {
    const lines = errorOutput.split('\n');
    const stack: StackFrame[] = [];
    let message = '';
    let type = 'Error';

    if (language === 'javascript' || language === 'typescript') {
      // Parse JavaScript/Node.js stack trace
      const errorLine = lines[0];
      const match = errorLine.match(/^(\w+Error): (.+)$/);
      if (match) {
        type = match[1];
        message = match[2];
      } else {
        message = errorLine;
      }

      // Parse stack frames: "at functionName (file:line:column)"
      const stackRegex = /at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/;
      for (let i = 1; i < lines.length; i++) {
        const frameMatch = lines[i].match(stackRegex);
        if (frameMatch) {
          stack.push({
            function: frameMatch[1] || 'anonymous',
            file: frameMatch[2],
            line: parseInt(frameMatch[3]),
            column: parseInt(frameMatch[4])
          });
        }
      }
    } else if (language === 'python') {
      // Parse Python stack trace
      const errorLine = lines[lines.length - 1];
      const match = errorLine.match(/^(\w+): (.+)$/);
      if (match) {
        type = match[1];
        message = match[2];
      }

      // Parse Python frames
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('File "')) {
          const fileMatch = lines[i].match(/File "(.+)", line (\d+)/);
          if (fileMatch) {
            stack.push({
              file: fileMatch[1],
              line: parseInt(fileMatch[2]),
              column: 0,
              function: lines[i + 1]?.trim() || 'unknown'
            });
          }
        }
      }
    }

    return { message, type, stack };
  }

  private analyzeRootCause(code: string, stackTrace: StackTrace, errorOutput: string): RootCauseAnalysis {
    const errorType = stackTrace.type;
    const errorMessage = stackTrace.message;
    
    // Analyze common error patterns
    const analysis = this.identifyErrorPattern(errorType, errorMessage, code);
    
    return {
      errorType,
      explanation: analysis.explanation,
      rootCause: analysis.rootCause,
      suggestedFix: analysis.suggestedFix,
      confidence: analysis.confidence
    };
  }

  private identifyErrorPattern(errorType: string, message: string, code: string): {
    explanation: string;
    rootCause: string;
    suggestedFix: string;
    confidence: number;
  } {
    // Reference Error
    if (errorType === 'ReferenceError') {
      const varMatch = message.match(/(\w+) is not defined/);
      const varName = varMatch ? varMatch[1] : 'variable';
      
      return {
        explanation: `You're trying to use "${varName}" but it hasn't been declared yet. Think of it like trying to use a tool that doesn't exist in your toolbox.`,
        rootCause: `The variable "${varName}" is being used before it's defined, or it was never defined at all.`,
        suggestedFix: `Add "let ${varName} = ..." or "const ${varName} = ..." before using it, or check for typos in the variable name.`,
        confidence: 0.9
      };
    }

    // Type Error
    if (errorType === 'TypeError') {
      if (message.includes('is not a function')) {
        const match = message.match(/(.+) is not a function/);
        const item = match ? match[1] : 'something';
        
        return {
          explanation: `You're trying to call "${item}" as a function, but it's not actually a function. It's like trying to drive a bicycle - bicycles aren't cars!`,
          rootCause: `"${item}" is not a function. It might be undefined, null, or a different data type.`,
          suggestedFix: `Check that "${item}" is actually a function. Add a check like "if (typeof ${item} === 'function')" or verify the function is properly imported/defined.`,
          confidence: 0.85
        };
      }
      
      if (message.includes('Cannot read property') || message.includes('Cannot read properties of')) {
        return {
          explanation: `You're trying to access a property on something that's null or undefined. It's like trying to open a door on a house that doesn't exist.`,
          rootCause: `Attempting to access a property on null or undefined value.`,
          suggestedFix: `Add a null check before accessing the property: "if (obj && obj.property)" or use optional chaining: "obj?.property"`,
          confidence: 0.9
        };
      }
    }

    // Syntax Error
    if (errorType === 'SyntaxError') {
      if (message.includes('Unexpected token')) {
        return {
          explanation: `There's a typo or incorrect syntax in your code. The JavaScript parser found something it didn't expect, like a missing comma or bracket.`,
          rootCause: `Invalid syntax - missing or extra punctuation, brackets, or keywords.`,
          suggestedFix: `Check for missing/extra brackets, commas, semicolons, or quotes. Use a linter or IDE to highlight syntax errors.`,
          confidence: 0.7
        };
      }
    }

    // Range Error
    if (errorType === 'RangeError') {
      if (message.includes('Maximum call stack size exceeded')) {
        return {
          explanation: `Your code is stuck in infinite recursion - a function keeps calling itself forever until the program runs out of memory. It's like standing between two mirrors that reflect each other infinitely.`,
          rootCause: `Infinite recursion detected. A function is calling itself without a proper exit condition.`,
          suggestedFix: `Add a base case to stop the recursion, or check if you accidentally created an infinite loop.`,
          confidence: 0.95
        };
      }
    }

    // Generic error
    return {
      explanation: `An error occurred: ${message}. This means something unexpected happened during execution.`,
      rootCause: `${errorType}: ${message}`,
      suggestedFix: `Review the error message and stack trace to identify the problematic line. Check the documentation for the functions you're using.`,
      confidence: 0.5
    };
  }

  private generatePatch(originalCode: string, analysis: RootCauseAnalysis): string {
    let patchedCode = originalCode;

    // Apply automatic fixes based on error type
    if (analysis.errorType === 'ReferenceError') {
      const varMatch = analysis.rootCause.match(/variable "(\w+)"/);
      if (varMatch) {
        const varName = varMatch[1];
        // Add variable declaration at the beginning
        patchedCode = `let ${varName};\n${originalCode}`;
      }
    }

    if (analysis.errorType === 'TypeError' && analysis.rootCause.includes('null or undefined')) {
      // Add null checks using optional chaining
      patchedCode = originalCode.replace(/(\w+)\.(\w+)/g, '$1?.$2');
    }

    return patchedCode;
  }

  private performStaticAnalysis(code: string): DebugIssue[] {
    const issues: DebugIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for console.log
      if (line.includes('console.log')) {
        issues.push({
          line: lineNum,
          column: line.indexOf('console.log'),
          message: 'Console.log statement found',
          type: 'warning',
          suggestion: 'Remove console.log or use a proper logging library'
        });
      }

      // Check for var usage
      if (line.match(/\bvar\s+\w+/)) {
        issues.push({
          line: lineNum,
          column: line.indexOf('var'),
          message: 'Using "var" instead of "let" or "const"',
          type: 'warning',
          suggestion: 'Use "let" or "const" instead of "var" for better scoping'
        });
      }

      // Check for == instead of ===
      if (line.includes('==') && !line.includes('===')) {
        issues.push({
          line: lineNum,
          column: line.indexOf('=='),
          message: 'Using loose equality (==) instead of strict equality (===)',
          type: 'warning',
          suggestion: 'Use === for strict equality comparison'
        });
      }

      // Check for missing semicolons (simple check)
      if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && 
          !line.trim().endsWith('}') && !line.trim().startsWith('//')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('const ') || trimmed.startsWith('let ') || 
            trimmed.startsWith('var ') || trimmed.includes('return ')) {
          issues.push({
            line: lineNum,
            column: line.length,
            message: 'Missing semicolon',
            type: 'info',
            suggestion: 'Add semicolon at end of statement'
          });
        }
      }

      // Check for empty catch blocks
      if (line.includes('catch') && lines[index + 1]?.trim() === '}') {
        issues.push({
          line: lineNum,
          column: 0,
          message: 'Empty catch block',
          type: 'warning',
          suggestion: 'Handle the error or at least log it'
        });
      }
    });

    return issues;
  }

  private combineIssues(
    staticIssues: DebugIssue[],
    executionResult: ExecutionResult,
    rootCauseAnalysis: RootCauseAnalysis | null
  ): DebugIssue[] {
    const issues = [...staticIssues];

    // Add runtime error as an issue
    if (!executionResult.success && executionResult.stackTrace) {
      const firstFrame = executionResult.stackTrace.stack[0];
      issues.push({
        line: firstFrame?.line || 1,
        column: firstFrame?.column || 0,
        message: `Runtime Error: ${executionResult.stackTrace.message}`,
        type: 'error',
        suggestion: rootCauseAnalysis?.suggestedFix || 'Check the error message and stack trace'
      });
    }

    return issues;
  }

  private calculateSeverity(issues: DebugIssue[]): 'low' | 'medium' | 'high' | 'critical' {
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;

    if (errorCount > 0) return 'critical';
    if (warningCount > 5) return 'high';
    if (warningCount > 2) return 'medium';
    return 'low';
  }
}
