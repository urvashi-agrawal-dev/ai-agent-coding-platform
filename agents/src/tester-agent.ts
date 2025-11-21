import { AgentRequest, AgentResponse, AgentType } from '../../shared/src/types';
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestGenerationResult {
  generatedTests: string;
  testCount: number;
  testCases: TestCase[];
  coverage: CoverageReport | null;
}

interface TestCase {
  name: string;
  description: string;
  category: 'unit' | 'integration' | 'edge-case';
}

interface TestExecutionResult {
  passed: number;
  failed: number;
  total: number;
  duration: number;
  details: TestDetail[];
  coverage?: CoverageReport;
}

interface TestDetail {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  stackTrace?: string;
}

interface CoverageReport {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  uncoveredLines: number[];
}

interface FixedTest {
  originalTest: string;
  fixedTest: string;
  issue: string;
  fix: string;
}

export class TesterAgent {
  private tempDir = path.join(process.cwd(), '.temp-tests');

  async process(request: AgentRequest): Promise<AgentResponse> {
    const action = request.context?.action || 'generate';
    
    let result: any;
    
    switch (action) {
      case 'generate':
        result = await this.generateTests(request.code, request.context);
        break;
      case 'run':
        result = await this.runTests(request.code, request.context?.testCode);
        break;
      case 'fix':
        result = await this.fixFailingTests(
          request.code,
          request.context?.testCode,
          request.context?.failures
        );
        break;
      default:
        result = await this.fullTestCycle(request.code);
    }
    
    return {
      agentType: AgentType.TESTER,
      success: true,
      data: result,
      suggestions: this.generateSuggestions(result),
      timestamp: new Date()
    };
  }

  private async fullTestCycle(code: string): Promise<any> {
    // Generate tests
    const generation = await this.generateTests(code, {});
    
    // Run tests
    const execution = await this.runTests(code, generation.generatedTests);
    
    // Fix failing tests if any
    let fixes = null;
    if (execution.failed > 0) {
      const failures = execution.details.filter(d => d.status === 'failed');
      fixes = await this.fixFailingTests(code, generation.generatedTests, failures);
    }
    
    return {
      generation,
      execution,
      fixes
    };
  }

  private async generateTests(code: string, context: any): Promise<TestGenerationResult> {
    // Parse code to extract functions, classes, and methods
    const codeStructure = this.parseCodeStructure(code);
    
    // Generate test cases
    const testCases = this.generateTestCases(codeStructure);
    
    // Generate Jest test code
    const generatedTests = this.generateJestCode(codeStructure, testCases);
    
    return {
      generatedTests,
      testCount: testCases.length,
      testCases,
      coverage: null
    };
  }

  private parseCodeStructure(code: string): CodeStructure {
    const structure: CodeStructure = {
      functions: [],
      classes: [],
      exports: []
    };

    // Extract functions
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
    let match;
    while ((match = functionRegex.exec(code)) !== null) {
      structure.functions.push({
        name: match[1],
        params: match[2].split(',').map(p => p.trim()).filter(p => p),
        isAsync: code.substring(Math.max(0, match.index - 10), match.index).includes('async'),
        isExported: code.substring(Math.max(0, match.index - 10), match.index).includes('export')
      });
    }

    // Extract arrow functions
    const arrowRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
    while ((match = arrowRegex.exec(code)) !== null) {
      const params = code.substring(match.index, match.index + 100).match(/\(([^)]*)\)/);
      structure.functions.push({
        name: match[1],
        params: params ? params[1].split(',').map(p => p.trim()).filter(p => p) : [],
        isAsync: code.substring(match.index, match.index + 50).includes('async'),
        isExported: match[0].includes('export')
      });
    }

    // Extract classes
    const classRegex = /(?:export\s+)?class\s+(\w+)/g;
    while ((match = classRegex.exec(code)) !== null) {
      const className = match[1];
      const methods = this.extractClassMethods(code, match.index);
      structure.classes.push({
        name: className,
        methods,
        isExported: match[0].includes('export')
      });
    }

    return structure;
  }

  private extractClassMethods(code: string, classStartIndex: number): FunctionInfo[] {
    const methods: FunctionInfo[] = [];
    const classBlock = this.extractBlock(code, classStartIndex);
    
    const methodRegex = /(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*{/g;
    let match;
    while ((match = methodRegex.exec(classBlock)) !== null) {
      if (match[1] !== 'constructor') {
        methods.push({
          name: match[1],
          params: match[2].split(',').map(p => p.trim()).filter(p => p),
          isAsync: classBlock.substring(Math.max(0, match.index - 10), match.index).includes('async'),
          isExported: false
        });
      }
    }
    
    return methods;
  }

  private extractBlock(code: string, startIndex: number): string {
    let braceCount = 0;
    let inBlock = false;
    let blockStart = -1;
    
    for (let i = startIndex; i < code.length; i++) {
      if (code[i] === '{') {
        if (!inBlock) {
          blockStart = i;
          inBlock = true;
        }
        braceCount++;
      } else if (code[i] === '}') {
        braceCount--;
        if (braceCount === 0 && inBlock) {
          return code.substring(blockStart, i + 1);
        }
      }
    }
    
    return '';
  }

  private generateTestCases(structure: CodeStructure): TestCase[] {
    const testCases: TestCase[] = [];

    // Generate tests for functions
    for (const func of structure.functions) {
      // Happy path test
      testCases.push({
        name: `${func.name} - should work with valid input`,
        description: `Test ${func.name} with valid parameters`,
        category: 'unit'
      });

      // Edge cases
      if (func.params.length > 0) {
        testCases.push({
          name: `${func.name} - should handle null/undefined`,
          description: `Test ${func.name} with null or undefined parameters`,
          category: 'edge-case'
        });

        testCases.push({
          name: `${func.name} - should handle empty values`,
          description: `Test ${func.name} with empty strings, arrays, or objects`,
          category: 'edge-case'
        });
      }

      // Async error handling
      if (func.isAsync) {
        testCases.push({
          name: `${func.name} - should handle async errors`,
          description: `Test ${func.name} error handling for rejected promises`,
          category: 'unit'
        });
      }
    }

    // Generate tests for classes
    for (const cls of structure.classes) {
      testCases.push({
        name: `${cls.name} - should instantiate correctly`,
        description: `Test ${cls.name} constructor`,
        category: 'unit'
      });

      for (const method of cls.methods) {
        testCases.push({
          name: `${cls.name}.${method.name} - should work correctly`,
          description: `Test ${cls.name}.${method.name} method`,
          category: 'unit'
        });
      }
    }

    return testCases;
  }

  private generateJestCode(structure: CodeStructure, testCases: TestCase[]): string {
    let testCode = `// Auto-generated Jest tests\n`;
    testCode += `// Generated by TestingAgent on ${new Date().toISOString()}\n\n`;

    // Add imports
    if (structure.functions.some(f => f.isExported) || structure.classes.some(c => c.isExported)) {
      const exports = [
        ...structure.functions.filter(f => f.isExported).map(f => f.name),
        ...structure.classes.filter(c => c.isExported).map(c => c.name)
      ];
      testCode += `import { ${exports.join(', ')} } from './code';\n\n`;
    }

    // Generate describe blocks for functions
    for (const func of structure.functions) {
      const funcTests = testCases.filter(tc => tc.name.startsWith(func.name));
      if (funcTests.length === 0) continue;

      testCode += `describe('${func.name}', () => {\n`;

      for (const testCase of funcTests) {
        testCode += this.generateTestBlock(func, testCase);
      }

      testCode += `});\n\n`;
    }

    // Generate describe blocks for classes
    for (const cls of structure.classes) {
      const clsTests = testCases.filter(tc => tc.name.startsWith(cls.name));
      if (clsTests.length === 0) continue;

      testCode += `describe('${cls.name}', () => {\n`;

      for (const testCase of clsTests) {
        if (testCase.name.includes('instantiate')) {
          testCode += `  it('${testCase.description}', () => {\n`;
          testCode += `    const instance = new ${cls.name}();\n`;
          testCode += `    expect(instance).toBeDefined();\n`;
          testCode += `    expect(instance).toBeInstanceOf(${cls.name});\n`;
          testCode += `  });\n\n`;
        } else {
          const methodMatch = testCase.name.match(/\.(\w+)/);
          if (methodMatch) {
            const method = cls.methods.find(m => m.name === methodMatch[1]);
            if (method) {
              testCode += this.generateMethodTestBlock(cls.name, method, testCase);
            }
          }
        }
      }

      testCode += `});\n\n`;
    }

    return testCode;
  }

  private generateTestBlock(func: FunctionInfo, testCase: TestCase): string {
    let test = `  it('${testCase.description}', ${func.isAsync ? 'async ' : ''}() => {\n`;

    if (testCase.category === 'edge-case') {
      if (testCase.name.includes('null/undefined')) {
        test += `    expect(() => ${func.name}(null)).not.toThrow();\n`;
        test += `    expect(() => ${func.name}(undefined)).not.toThrow();\n`;
      } else if (testCase.name.includes('empty')) {
        if (func.params.length > 0) {
          test += `    const result = ${func.isAsync ? 'await ' : ''}${func.name}('');\n`;
          test += `    expect(result).toBeDefined();\n`;
        }
      }
    } else {
      // Happy path
      const mockParams = func.params.map(p => this.generateMockValue(p)).join(', ');
      test += `    const result = ${func.isAsync ? 'await ' : ''}${func.name}(${mockParams});\n`;
      test += `    expect(result).toBeDefined();\n`;
      
      if (func.isAsync && testCase.name.includes('error')) {
        test += `    // Test error handling\n`;
        test += `    await expect(${func.name}(null)).rejects.toThrow();\n`;
      }
    }

    test += `  });\n\n`;
    return test;
  }

  private generateMethodTestBlock(className: string, method: FunctionInfo, testCase: TestCase): string {
    let test = `  it('${testCase.description}', ${method.isAsync ? 'async ' : ''}() => {\n`;
    test += `    const instance = new ${className}();\n`;
    
    const mockParams = method.params.map(p => this.generateMockValue(p)).join(', ');
    test += `    const result = ${method.isAsync ? 'await ' : ''}instance.${method.name}(${mockParams});\n`;
    test += `    expect(result).toBeDefined();\n`;
    test += `  });\n\n`;
    
    return test;
  }

  private generateMockValue(param: string): string {
    const paramLower = param.toLowerCase();
    
    if (paramLower.includes('string') || paramLower.includes('name') || paramLower.includes('text')) {
      return `'test'`;
    }
    if (paramLower.includes('number') || paramLower.includes('count') || paramLower.includes('id')) {
      return '1';
    }
    if (paramLower.includes('bool')) {
      return 'true';
    }
    if (paramLower.includes('array') || paramLower.includes('list')) {
      return '[]';
    }
    if (paramLower.includes('object') || paramLower.includes('data')) {
      return '{}';
    }
    
    return `'mockValue'`;
  }

  private async runTests(code: string, testCode: string): Promise<TestExecutionResult> {
    try {
      // Create temp directory
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }

      // Write code and test files
      const codePath = path.join(this.tempDir, 'code.js');
      const testPath = path.join(this.tempDir, 'code.test.js');
      
      fs.writeFileSync(codePath, code);
      fs.writeFileSync(testPath, testCode);

      // Create minimal Jest config
      const jestConfig = {
        testEnvironment: 'node',
        collectCoverage: true,
        coverageDirectory: path.join(this.tempDir, 'coverage'),
        testMatch: ['**/*.test.js']
      };
      
      const configPath = path.join(this.tempDir, 'jest.config.json');
      fs.writeFileSync(configPath, JSON.stringify(jestConfig, null, 2));

      // Run Jest
      const startTime = Date.now();
      let output = '';
      
      try {
        output = execSync(
          `npx jest --config=${configPath} --json --testLocationInResults`,
          { 
            cwd: this.tempDir,
            encoding: 'utf-8',
            timeout: 30000
          }
        );
      } catch (error: any) {
        output = error.stdout || error.message;
      }

      const duration = Date.now() - startTime;

      // Parse Jest output
      const result = this.parseJestOutput(output);
      
      // Parse coverage
      const coverage = this.parseCoverage();

      return {
        ...result,
        duration,
        coverage
      };
    } catch (error: any) {
      return {
        passed: 0,
        failed: 0,
        total: 0,
        duration: 0,
        details: [{
          name: 'Test execution',
          status: 'failed',
          duration: 0,
          error: error.message
        }]
      };
    }
  }

  private parseJestOutput(output: string): Omit<TestExecutionResult, 'duration' | 'coverage'> {
    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON output from Jest');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      const details: TestDetail[] = [];
      
      if (result.testResults) {
        for (const testFile of result.testResults) {
          for (const testResult of testFile.assertionResults || []) {
            details.push({
              name: testResult.title || testResult.fullName,
              status: testResult.status === 'passed' ? 'passed' : 
                      testResult.status === 'failed' ? 'failed' : 'skipped',
              duration: testResult.duration || 0,
              error: testResult.failureMessages?.join('\n'),
              stackTrace: testResult.failureMessages?.join('\n')
            });
          }
        }
      }

      return {
        passed: result.numPassedTests || 0,
        failed: result.numFailedTests || 0,
        total: result.numTotalTests || 0,
        details
      };
    } catch (error) {
      return {
        passed: 0,
        failed: 0,
        total: 0,
        details: []
      };
    }
  }

  private parseCoverage(): CoverageReport | undefined {
    try {
      const coveragePath = path.join(this.tempDir, 'coverage', 'coverage-summary.json');
      if (!fs.existsSync(coveragePath)) {
        return undefined;
      }

      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
      const total = coverageData.total;

      return {
        statements: total.statements.pct,
        branches: total.branches.pct,
        functions: total.functions.pct,
        lines: total.lines.pct,
        uncoveredLines: []
      };
    } catch (error) {
      return undefined;
    }
  }

  private async fixFailingTests(
    code: string,
    testCode: string,
    failures: TestDetail[]
  ): Promise<FixedTest[]> {
    const fixes: FixedTest[] = [];

    for (const failure of failures) {
      const fix = this.analyzeAndFixTest(testCode, failure);
      if (fix) {
        fixes.push(fix);
      }
    }

    return fixes;
  }

  private analyzeAndFixTest(testCode: string, failure: TestDetail): FixedTest | null {
    const errorMessage = failure.error || '';
    
    // Common test failures and fixes
    if (errorMessage.includes('is not a function')) {
      return {
        originalTest: this.extractTest(testCode, failure.name),
        fixedTest: this.extractTest(testCode, failure.name).replace(/\(\)/g, ''),
        issue: 'Trying to call something that is not a function',
        fix: 'Added proper function call or removed incorrect parentheses'
      };
    }

    if (errorMessage.includes('Cannot read property') || errorMessage.includes('Cannot read properties of undefined')) {
      const fixed = this.extractTest(testCode, failure.name).replace(
        /expect\(([^)]+)\)/g,
        'expect($1 || {})'
      );
      return {
        originalTest: this.extractTest(testCode, failure.name),
        fixedTest: fixed,
        issue: 'Accessing property of undefined',
        fix: 'Added null check with default value'
      };
    }

    if (errorMessage.includes('Expected')) {
      return {
        originalTest: this.extractTest(testCode, failure.name),
        fixedTest: this.extractTest(testCode, failure.name).replace(
          /expect\(([^)]+)\)\.toBe\(([^)]+)\)/g,
          'expect($1).toEqual($2)'
        ),
        issue: 'Assertion mismatch',
        fix: 'Changed toBe to toEqual for deep comparison'
      };
    }

    return null;
  }

  private extractTest(testCode: string, testName: string): string {
    const lines = testCode.split('\n');
    let inTest = false;
    let braceCount = 0;
    let testLines: string[] = [];

    for (const line of lines) {
      if (line.includes(`it('`) && line.includes(testName)) {
        inTest = true;
      }

      if (inTest) {
        testLines.push(line);
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount === 0 && testLines.length > 1) {
          break;
        }
      }
    }

    return testLines.join('\n');
  }

  private generateSuggestions(result: any): string[] {
    const suggestions: string[] = [];

    if (result.execution) {
      const { passed, failed, total, coverage } = result.execution;
      
      if (failed > 0) {
        suggestions.push(`Fix ${failed} failing test${failed > 1 ? 's' : ''}`);
      }
      
      if (coverage) {
        if (coverage.statements < 80) {
          suggestions.push(`Improve statement coverage (currently ${coverage.statements}%)`);
        }
        if (coverage.branches < 80) {
          suggestions.push(`Add tests for uncovered branches (currently ${coverage.branches}%)`);
        }
      }
      
      if (total < 5) {
        suggestions.push('Add more comprehensive test cases');
      }
    }

    suggestions.push('Consider adding integration tests');
    suggestions.push('Add edge case tests for error scenarios');

    return suggestions;
  }
}

interface CodeStructure {
  functions: FunctionInfo[];
  classes: ClassInfo[];
  exports: string[];
}

interface FunctionInfo {
  name: string;
  params: string[];
  isAsync: boolean;
  isExported: boolean;
}

interface ClassInfo {
  name: string;
  methods: FunctionInfo[];
  isExported: boolean;
}
