export enum AgentType {
  ARCHITECT = 'architect',
  DEBUGGER = 'debugger',
  REVIEWER = 'reviewer',
  TESTER = 'tester',
  PRODUCTIVITY = 'productivity'
}

export interface AgentRequest {
  agentType: AgentType;
  code: string;
  context?: Record<string, any>;
  projectFiles?: ProjectFile[];
}

export interface AgentResponse {
  agentType: AgentType;
  success: boolean;
  data: any;
  suggestions?: string[];
  errors?: string[];
  timestamp: Date;
}

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
}

export interface TestResult {
  passed: number;
  failed: number;
  total: number;
  details: TestCase[];
}

export interface TestCase {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

export interface TestGenerationResult {
  generatedTests: string;
  testCount: number;
  testCases: GeneratedTestCase[];
  coverage: CoverageReport | null;
}

export interface GeneratedTestCase {
  name: string;
  description: string;
  category: 'unit' | 'integration' | 'edge-case';
}

export interface TestExecutionResult {
  passed: number;
  failed: number;
  total: number;
  duration: number;
  details: TestDetail[];
  coverage?: CoverageReport;
}

export interface TestDetail {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  stackTrace?: string;
}

export interface CoverageReport {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  uncoveredLines: number[];
}

export interface FixedTest {
  originalTest: string;
  fixedTest: string;
  issue: string;
  fix: string;
}

export interface DebugReport {
  issues: DebugIssue[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface DebugIssue {
  line: number;
  column: number;
  message: string;
  type: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  stackTrace?: StackTrace;
  exitCode: number;
  executionTime: number;
}

export interface StackTrace {
  message: string;
  type: string;
  stack: StackFrame[];
}

export interface StackFrame {
  file: string;
  line: number;
  column: number;
  function: string;
}

export interface RootCauseAnalysis {
  errorType: string;
  explanation: string;
  rootCause: string;
  suggestedFix: string;
  patchedCode?: string;
  confidence: number;
}

export interface Documentation {
  projectName: string;
  description: string;
  structure: string;
  apiDocs: string;
  generatedAt: Date;
}

export interface ArchitectureAnalysis {
  detectedPatterns: string[];
  layerStructure: LayerInfo[];
  dependencies: DependencyGraph;
  designFlaws: DesignFlaw[];
  metrics: ArchitectureMetrics;
  recommendations: Recommendation[];
  designDocument: string;
}

export interface LayerInfo {
  name: string;
  files: string[];
  responsibilities: string[];
}

export interface DependencyGraph {
  nodes: string[];
  edges: { from: string; to: string; type: string }[];
  circularDependencies: string[][];
}

export interface DesignFlaw {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  impact: string;
  suggestion: string;
}

export interface ArchitectureMetrics {
  complexity: number;
  maintainability: number;
  modularity: number;
  coupling: number;
  cohesion: number;
  testability: number;
}

export interface Recommendation {
  category: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  benefits: string[];
  implementation: string;
}

export interface CodeReview {
  overallScore: number;
  summary: string;
  logicFlaws: LogicFlaw[];
  securityIssues: SecurityIssue[];
  codeQualityIssues: CodeQualityIssue[];
  improvements: ReviewSuggestion[];
  metrics: ReviewMetrics;
  verdict: 'approved' | 'approved-with-comments' | 'changes-requested' | 'rejected';
}

export interface LogicFlaw {
  line: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  impact: string;
  suggestion: string;
  codeSnippet: string;
}

export interface SecurityIssue {
  line: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  vulnerability: string;
  description: string;
  cwe?: string;
  remediation: string;
  codeSnippet: string;
}

export interface CodeQualityIssue {
  line: number;
  severity: 'info' | 'warning' | 'error';
  category: string;
  message: string;
  suggestion: string;
}

export interface ReviewSuggestion {
  priority: 'low' | 'medium' | 'high';
  category: string;
  title: string;
  description: string;
  before?: string;
  after?: string;
}

export interface ReviewMetrics {
  complexity: number;
  maintainability: number;
  security: number;
  performance: number;
  testability: number;
  documentation: number;
}
