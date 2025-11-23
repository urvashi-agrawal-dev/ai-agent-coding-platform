import { AgentRequest, AgentResponse, AgentType } from '../../shared/src/types';
import { LLMService } from './services/llm.service';

interface CodeReview {
  score: number;
  summary: string;
  security: SecurityIssue[];
  performance: PerformanceIssue[];
  readability: ReadabilityIssue[];
  bestPractices: string[];
}

interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line?: number;
  suggestion: string;
}

interface PerformanceIssue {
  impact: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

interface ReadabilityIssue {
  description: string;
  suggestion: string;
}

export class ReviewerAgent {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    const review = await this.performDeepReview(request.code);

    return {
      agentType: AgentType.REVIEWER,
      success: true,
      data: review,
      suggestions: [
        ...review.security.map(s => `[SECURITY] ${s.description}`),
        ...review.performance.map(p => `[PERF] ${p.description}`),
        ...review.bestPractices
      ],
      timestamp: new Date()
    };
  }

  private async performDeepReview(code: string): Promise<CodeReview> {
    const prompt = `
You are an expert Senior Software Engineer performing a code review.
Analyze the following code for Security, Performance, and Readability.

Code:
\`\`\`
${code}
\`\`\`

Return a JSON response with this structure:
{
  "score": number (0-10),
  "summary": "string (executive summary)",
  "security": [{ "severity": "low|medium|high|critical", "description": "string", "line": number, "suggestion": "string" }],
  "performance": [{ "impact": "low|medium|high", "description": "string", "suggestion": "string" }],
  "readability": [{ "description": "string", "suggestion": "string" }],
  "bestPractices": ["string"]
}
`;

    try {
      const response = await this.llmService.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Review failed:", error);
      return {
        score: 0,
        summary: "AI Review Unavailable",
        security: [],
        performance: [],
        readability: [],
        bestPractices: ["Check AWS Credentials"]
      };
    }
  }
}
