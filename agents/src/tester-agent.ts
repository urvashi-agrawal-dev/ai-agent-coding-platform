import { AgentRequest, AgentResponse, AgentType } from '../../shared/src/types';
import { LLMService } from './services/llm.service';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestGenerationResult {
  generatedTests: string;
  testCount: number;
  testCases: string[];
  coverage: CoverageReport | null;
}

interface CoverageReport {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export class TesterAgent {
  private llmService: LLMService;
  private tempDir = path.join(process.cwd(), '.temp-tests');

  constructor() {
    this.llmService = new LLMService();
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    const action = request.context?.action || 'generate';
    let result: any;

    if (action === 'generate') {
      result = await this.generateTests(request.code);
    } else if (action === 'run') {
      result = await this.runTests(request.code, request.context?.testCode);
    }

    return {
      agentType: AgentType.TESTER,
      success: true,
      data: result,
      suggestions: ['Run tests to verify coverage', 'Review generated edge cases'],
      timestamp: new Date()
    };
  }

  private async generateTests(code: string): Promise<TestGenerationResult> {
    const prompt = `
You are an expert QA Engineer. I will provide you with code.
Your task is to write a complete, runnable Jest test suite for it.

Requirements:
1. Use 'jest' syntax (describe, it, expect).
2. Cover happy paths, edge cases, and error handling.
3. Mock external dependencies if any.
4. Return ONLY the code, no markdown, no explanations.

Code:
\`\`\`
${code}
\`\`\`
`;

    try {
      const response = await this.llmService.generateText(prompt);
      const generatedTests = response.replace(/\`\`\`\w*\n/g, '').replace(/\`\`\`/g, '').trim();

      // Simple heuristic to count tests
      const testCount = (generatedTests.match(/it\(/g) || []).length;
      const testCases = generatedTests.match(/it\('([^']+)'/g)?.map(m => m.slice(4, -1)) || [];

      return {
        generatedTests,
        testCount,
        testCases,
        coverage: null // Coverage requires running the tests
      };
    } catch (error) {
      console.error("Test generation failed:", error);
      return {
        generatedTests: "// Error generating tests",
        testCount: 0,
        testCases: [],
        coverage: null
      };
    }
  }

  private async runTests(code: string, testCode: string): Promise<any> {
    // Ensure temp dir exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    const codePath = path.join(this.tempDir, 'code.js');
    const testPath = path.join(this.tempDir, 'code.test.js');

    // Write files
    // Note: In a real app, we'd handle imports/exports more robustly
    fs.writeFileSync(codePath, code);
    fs.writeFileSync(testPath, testCode.replace("from './code'", "from './code.js'"));

    try {
      // Run Jest (assuming jest is installed in the project)
      // We use --no-cache to ensure fresh runs
      const output = execSync(`npx jest ${testPath} --no-cache --json`, {
        cwd: this.tempDir,
        encoding: 'utf-8'
      });

      return JSON.parse(output);
    } catch (error: any) {
      // Jest throws on test failure, but we want the output
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch (e) {
          return { error: "Could not parse Jest output" };
        }
      }
      return { error: error.message };
    }
  }
}
