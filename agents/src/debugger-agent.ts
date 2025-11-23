import { AgentRequest, AgentResponse, AgentType, DebugReport, DebugIssue } from '../../shared/src/types';
import { spawn } from 'child_process';
import { LLMService } from './services/llm.service';

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
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

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
      try {
        rootCauseAnalysis = await this.analyzeRootCause(
          request.code,
          executionResult.stackTrace,
          executionResult.error
        );

        // Auto-patch if requested and confidence is high
        if (autoFix && rootCauseAnalysis.confidence > 0.7) {
          rootCauseAnalysis.patchedCode = await this.generatePatch(
            request.code,
            rootCauseAnalysis
          );
        }
      } catch (error) {
        console.error("Error in AI analysis:", error);
        // Fallback to basic error reporting if LLM fails
        rootCauseAnalysis = {
          errorType: executionResult.stackTrace.type,
          explanation: "AI analysis failed. Please check the stack trace.",
          rootCause: executionResult.error,
          suggestedFix: "Review the error message.",
          confidence: 0.1
        };
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

  private async analyzeRootCause(code: string, stackTrace: StackTrace, errorOutput: string): Promise<RootCauseAnalysis> {
    const prompt = `
You are an expert software debugger. I will provide you with a code snippet and an error stack trace.
Your task is to analyze the error, explain the root cause in simple terms, and suggest a fix.
Return your response in JSON format with the following structure:
{
  "errorType": "string",
  "explanation": "string (simple explanation for a junior developer)",
  "rootCause": "string (technical root cause)",
  "suggestedFix": "string (how to fix it)",
  "confidence": number (0.0 to 1.0)
}

Code:
\`\`\`
${code}
\`\`\`

Error Output:
${errorOutput}

Stack Trace:
${JSON.stringify(stackTrace, null, 2)}
`;

    try {
      const response = await this.llmService.generateText(prompt);
      // Extract JSON from response if it contains markdown code blocks
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Error parsing LLM response:", error);
      return {
        errorType: stackTrace.type,
        explanation: "Could not analyze error with AI.",
        rootCause: "LLM Analysis Failed",
        suggestedFix: "Check the logs.",
        confidence: 0
      };
    }
  }

  private async generatePatch(originalCode: string, analysis: RootCauseAnalysis): Promise<string> {
    const prompt = `
You are an expert software developer. I will provide you with code and a bug analysis.
Your task is to generate the FIXED code. Return ONLY the full fixed code, no markdown, no explanations.

Original Code:
${originalCode}

Bug Analysis:
${JSON.stringify(analysis, null, 2)}
`;

    try {
      const response = await this.llmService.generateText(prompt);
      // Clean up response if it has markdown
      return response.replace(/\`\`\`\w*\n/g, '').replace(/\`\`\`/g, '').trim();
    } catch (error) {
      return originalCode;
    }
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
      if (line.match(/\\bvar\\s+\\w+/)) {
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
