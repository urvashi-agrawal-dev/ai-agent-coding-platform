import { ProjectFile } from '../../../shared/src/types';

interface QuestionAnalysis {
  type: 'function' | 'dataflow' | 'bug' | 'performance' | 'explanation' | 'general';
  targetFunction?: string;
  targetFile?: string;
  keywords: string[];
}

interface VoiceResponse {
  answer: string;
  codeTrace?: TraceStep[];
  dataFlow?: string[];
  performance?: PerformanceAnalysis;
  relatedCode?: RelatedCode[];
}

interface TraceStep {
  file?: string;
  line?: number;
  description: string;
  code?: string;
}

interface PerformanceAnalysis {
  issues: PerformanceIssue[];
}

interface PerformanceIssue {
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

interface RelatedCode {
  name: string;
  location: string;
  snippet: string;
}

export class VoiceAgent {
  async processQuestion(question: string, code: string, projectFiles?: ProjectFile[]): Promise<VoiceResponse> {
    const analysis = this.analyzeQuestion(question);
    const files = projectFiles || [{ path: 'main.js', content: code, language: 'javascript' }];
    
    switch (analysis.type) {
      case 'function':
        return this.explainFunction(analysis, code, files);
      case 'dataflow':
        return this.traceDataFlow(analysis, code, files);
      case 'bug':
        return this.findBug(analysis, code, files);
      case 'performance':
        return this.analyzePerformance(analysis, code, files);
      case 'explanation':
        return this.explainCode(analysis, code, files);
      default:
        return this.generalAnswer(question, code, files);
    }
  }

  private analyzeQuestion(question: string): QuestionAnalysis {
    const lowerQuestion = question.toLowerCase();
    
    // Detect question type
    if (lowerQuestion.includes('what') && (lowerQuestion.includes('function') || lowerQuestion.includes('does'))) {
      return {
        type: 'function',
        keywords: this.extractKeywords(question),
        targetFunction: this.extractFunctionName(question)
      };
    }
    
    if (lowerQuestion.includes('flow') || lowerQuestion.includes('data flow') || lowerQuestion.includes('how does')) {
      return {
        type: 'dataflow',
        keywords: this.extractKeywords(question)
      };
    }
    
    if (lowerQuestion.includes('bug') || lowerQuestion.includes('error') || lowerQuestion.includes('wrong')) {
      return {
        type: 'bug',
        keywords: this.extractKeywords(question)
      };
    }
    
    if (lowerQuestion.includes('slow') || lowerQuestion.includes('performance') || lowerQuestion.includes('optimize')) {
      return {
        type: 'performance',
        keywords: this.extractKeywords(question)
      };
    }
    
    if (lowerQuestion.includes('explain') || lowerQuestion.includes('how') || lowerQuestion.includes('why')) {
      return {
        type: 'explanation',
        keywords: this.extractKeywords(question)
      };
    }
    
    return {
      type: 'general',
      keywords: this.extractKeywords(question)
    };
  }

  private extractKeywords(question: string): string[] {
    const stopWords = ['what', 'how', 'why', 'does', 'this', 'the', 'is', 'are', 'in', 'to', 'a', 'an'];
    return question
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
  }

  private extractFunctionName(question: string): string | undefined {
    const words = question.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      if (words[i].match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        return words[i];
      }
    }
    return undefined;
  }

  private explainFunction(analysis: QuestionAnalysis, code: string, files: ProjectFile[]): VoiceResponse {
    const functions = this.extractFunctions(code);
    
    if (functions.length === 0) {
      return {
        answer: "I don't see any functions in this code. The code appears to be a simple script or contains only inline code."
      };
    }
    
    const targetFunc = analysis.targetFunction 
      ? functions.find(f => f.name === analysis.targetFunction)
      : functions[0];
    
    if (!targetFunc) {
      return {
        answer: `I found ${functions.length} function(s) in the code: ${functions.map(f => f.name).join(', ')}. Which one would you like me to explain?`
      };
    }
    
    const explanation = this.generateFunctionExplanation(targetFunc, code);
    const trace = this.traceFunctionExecution(targetFunc, code);
    
    return {
      answer: explanation,
      codeTrace: trace,
      relatedCode: this.findRelatedCode(targetFunc.name, files)
    };
  }

  private extractFunctions(code: string): Array<{ name: string; params: string[]; body: string }> {
    const functions: Array<any> = [];
    
    // Regular functions
    const funcRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*{([^}]*)}/g;
    let match;
    while ((match = funcRegex.exec(code)) !== null) {
      functions.push({
        name: match[1],
        params: match[2].split(',').map(p => p.trim()).filter(p => p),
        body: match[3]
      });
    }
    
    // Arrow functions
    const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*{([^}]*)}/g;
    while ((match = arrowRegex.exec(code)) !== null) {
      functions.push({
        name: match[1],
        params: match[2].split(',').map(p => p.trim()).filter(p => p),
        body: match[3]
      });
    }
    
    return functions;
  }

  private generateFunctionExplanation(func: any, code: string): string {
    const purpose = this.inferFunctionPurpose(func.name);
    const paramDesc = func.params.length > 0 
      ? `It takes ${func.params.length} parameter(s): ${func.params.join(', ')}.`
      : 'It takes no parameters.';
    
    const operations = this.analyzeOperations(func.body);
    
    return `The function "${func.name}" ${purpose}. ${paramDesc} ${operations}`;
  }

  private inferFunctionPurpose(name: string): string {
    const nameLower = name.toLowerCase();
    
    if (nameLower.startsWith('get')) return 'retrieves or fetches data';
    if (nameLower.startsWith('set')) return 'sets or updates a value';
    if (nameLower.startsWith('create')) return 'creates a new object or resource';
    if (nameLower.startsWith('update')) return 'updates existing data';
    if (nameLower.startsWith('delete')) return 'removes or deletes data';
    if (nameLower.startsWith('calculate') || nameLower.startsWith('compute')) return 'performs calculations';
    if (nameLower.startsWith('validate')) return 'validates input or data';
    if (nameLower.startsWith('handle')) return 'handles an event or action';
    if (nameLower.startsWith('process')) return 'processes data';
    
    return 'performs an operation';
  }

  private analyzeOperations(body: string): string {
    const operations: string[] = [];
    
    if (body.includes('return')) operations.push('returns a value');
    if (body.includes('if') || body.includes('?')) operations.push('makes conditional decisions');
    if (body.includes('for') || body.includes('while') || body.includes('forEach')) operations.push('loops through data');
    if (body.includes('await') || body.includes('Promise')) operations.push('performs asynchronous operations');
    if (body.includes('console.log')) operations.push('logs output');
    if (body.includes('throw')) operations.push('can throw errors');
    
    return operations.length > 0 
      ? `Inside, it ${operations.join(', ')}.`
      : 'It contains basic logic.';
  }

  private traceFunctionExecution(func: any, code: string): TraceStep[] {
    const trace: TraceStep[] = [];
    const lines = func.body.split('\n').filter((l: string) => l.trim());
    
    trace.push({
      description: `Function "${func.name}" starts execution`,
      code: `function ${func.name}(${func.params.join(', ')})`
    });
    
    lines.forEach((line: string, idx: number) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('const') || trimmed.startsWith('let') || trimmed.startsWith('var')) {
        trace.push({
          line: idx + 1,
          description: 'Declares a variable',
          code: trimmed
        });
      } else if (trimmed.startsWith('if')) {
        trace.push({
          line: idx + 1,
          description: 'Checks a condition',
          code: trimmed
        });
      } else if (trimmed.startsWith('return')) {
        trace.push({
          line: idx + 1,
          description: 'Returns the result',
          code: trimmed
        });
      } else if (trimmed.includes('await')) {
        trace.push({
          line: idx + 1,
          description: 'Waits for async operation',
          code: trimmed
        });
      }
    });
    
    return trace;
  }

  private traceDataFlow(analysis: QuestionAnalysis, code: string, files: ProjectFile[]): VoiceResponse {
    const flow = this.analyzeDataFlow(code);
    
    return {
      answer: `Here's how data flows through this code: ${flow.summary}`,
      dataFlow: flow.steps,
      codeTrace: flow.trace
    };
  }

  private analyzeDataFlow(code: string): { summary: string; steps: string[]; trace: TraceStep[] } {
    const steps: string[] = [];
    const trace: TraceStep[] = [];
    
    // Find input sources
    if (code.includes('req.body') || code.includes('req.params')) {
      steps.push('Data enters from HTTP request');
      trace.push({ description: 'Request data received', code: 'req.body / req.params' });
    }
    
    // Find transformations
    if (code.includes('map') || code.includes('filter') || code.includes('reduce')) {
      steps.push('Data is transformed using array methods');
      trace.push({ description: 'Data transformation applied' });
    }
    
    // Find validations
    if (code.includes('validate') || code.includes('if')) {
      steps.push('Data is validated');
      trace.push({ description: 'Validation checks performed' });
    }
    
    // Find storage
    if (code.includes('save') || code.includes('create') || code.includes('insert')) {
      steps.push('Data is saved to database');
      trace.push({ description: 'Data persisted to storage' });
    }
    
    // Find output
    if (code.includes('res.json') || code.includes('res.send') || code.includes('return')) {
      steps.push('Data is returned as response');
      trace.push({ description: 'Response sent to client' });
    }
    
    const summary = steps.length > 0 
      ? steps.join(', then ')
      : 'The data flow is straightforward with minimal transformations';
    
    return { summary, steps, trace };
  }

  private findBug(analysis: QuestionAnalysis, code: string, files: ProjectFile[]): VoiceResponse {
    const bugs = this.detectCommonBugs(code);
    
    if (bugs.length === 0) {
      return {
        answer: "I don't see any obvious bugs in this code. However, bugs can be subtle. Consider adding error handling, input validation, and tests to catch edge cases."
      };
    }
    
    const mainBug = bugs[0];
    const trace = bugs.map(bug => ({
      line: bug.line,
      description: bug.description,
      code: bug.code
    }));
    
    return {
      answer: `I found a potential bug: ${mainBug.description}. ${mainBug.fix}`,
      codeTrace: trace
    };
  }

  private detectCommonBugs(code: string): Array<{ line: number; description: string; code: string; fix: string }> {
    const bugs: Array<any> = [];
    const lines = code.split('\n');
    
    lines.forEach((line, idx) => {
      // Undefined variable access
      if (line.includes('.') && !line.includes('?.') && !line.includes('if')) {
        bugs.push({
          line: idx + 1,
          description: 'Potential null/undefined access',
          code: line.trim(),
          fix: 'Use optional chaining (?.) or add null checks'
        });
      }
      
      // Missing await
      if (line.includes('Promise') && !line.includes('await') && !line.includes('.then')) {
        bugs.push({
          line: idx + 1,
          description: 'Promise not awaited',
          code: line.trim(),
          fix: 'Add await keyword or use .then()'
        });
      }
      
      // == instead of ===
      if (line.includes('==') && !line.includes('===')) {
        bugs.push({
          line: idx + 1,
          description: 'Using loose equality (==)',
          code: line.trim(),
          fix: 'Use strict equality (===) instead'
        });
      }
    });
    
    return bugs;
  }

  private analyzePerformance(analysis: QuestionAnalysis, code: string, files: ProjectFile[]): VoiceResponse {
    const issues = this.findPerformanceIssues(code);
    
    if (issues.length === 0) {
      return {
        answer: "The code looks reasonably efficient. No major performance issues detected.",
        performance: { issues: [] }
      };
    }
    
    const summary = `I found ${issues.length} performance issue(s). The main concern is: ${issues[0].description}`;
    
    return {
      answer: summary,
      performance: { issues }
    };
  }

  private findPerformanceIssues(code: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    
    // Nested loops
    if (code.match(/for.*for/s) || code.match(/forEach.*forEach/s)) {
      issues.push({
        severity: 'high',
        description: 'Nested loops detected - O(n²) complexity',
        suggestion: 'Consider using a hash map or Set for O(n) lookup instead'
      });
    }
    
    // Synchronous operations in loops
    if (code.includes('for') && code.includes('await')) {
      issues.push({
        severity: 'medium',
        description: 'Awaiting inside a loop - sequential execution',
        suggestion: 'Use Promise.all() to run operations in parallel'
      });
    }
    
    // Large array operations
    if (code.includes('.map(') && code.includes('.filter(')) {
      issues.push({
        severity: 'low',
        description: 'Multiple array iterations',
        suggestion: 'Combine map and filter into a single reduce operation'
      });
    }
    
    // Missing memoization
    if (code.match(/function.*\{.*for/s)) {
      issues.push({
        severity: 'low',
        description: 'Repeated calculations without caching',
        suggestion: 'Consider memoizing expensive function results'
      });
    }
    
    return issues;
  }

  private explainCode(analysis: QuestionAnalysis, code: string, files: ProjectFile[]): VoiceResponse {
    const explanation = this.generateCodeExplanation(code);
    const trace = this.generateExecutionTrace(code);
    
    return {
      answer: explanation,
      codeTrace: trace
    };
  }

  private generateCodeExplanation(code: string): string {
    const lines = code.split('\n').filter(l => l.trim()).length;
    const functions = this.extractFunctions(code);
    const hasAsync = code.includes('async') || code.includes('await');
    const hasLoops = code.includes('for') || code.includes('while') || code.includes('forEach');
    
    let explanation = `This code has ${lines} lines. `;
    
    if (functions.length > 0) {
      explanation += `It defines ${functions.length} function(s): ${functions.map(f => f.name).join(', ')}. `;
    }
    
    if (hasAsync) {
      explanation += 'It uses asynchronous operations. ';
    }
    
    if (hasLoops) {
      explanation += 'It contains loops for iteration. ';
    }
    
    return explanation;
  }

  private generateExecutionTrace(code: string): TraceStep[] {
    const trace: TraceStep[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
        if (trimmed.startsWith('function') || trimmed.startsWith('const') && trimmed.includes('=>')) {
          trace.push({
            line: idx + 1,
            description: 'Function definition',
            code: trimmed.substring(0, 50)
          });
        } else if (trimmed.startsWith('if')) {
          trace.push({
            line: idx + 1,
            description: 'Conditional check',
            code: trimmed
          });
        } else if (trimmed.startsWith('return')) {
          trace.push({
            line: idx + 1,
            description: 'Return statement',
            code: trimmed
          });
        }
      }
    });
    
    return trace;
  }

  private generalAnswer(question: string, code: string, files: ProjectFile[]): VoiceResponse {
    return {
      answer: `I understand you're asking about the code. Could you be more specific? Try asking "What does this function do?", "How does data flow?", "What's the bug?", or "Why is this slow?"`
    };
  }

  private findRelatedCode(functionName: string, files: ProjectFile[]): RelatedCode[] {
    const related: RelatedCode[] = [];
    
    for (const file of files) {
      if (file.content.includes(functionName)) {
        const lines = file.content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes(functionName) && !line.includes(`function ${functionName}`)) {
            related.push({
              name: `Usage in ${file.path}`,
              location: `${file.path}:${idx + 1}`,
              snippet: line.trim()
            });
          }
        });
      }
    }
    
    return related.slice(0, 3);
  }
}
