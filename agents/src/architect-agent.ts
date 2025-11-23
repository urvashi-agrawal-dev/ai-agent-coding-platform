import { AgentRequest, AgentResponse, AgentType, ProjectFile } from '../../shared/src/types';
import { LLMService } from './services/llm.service';

interface ArchitectureAnalysis {
  detectedPatterns: string[];
  layerStructure: LayerInfo[];
  dependencies: DependencyGraph;
  designFlaws: DesignFlaw[];
  metrics: ArchitectureMetrics;
  recommendations: Recommendation[];
  designDocument: string;
}

interface LayerInfo {
  name: string;
  files: string[];
  responsibilities: string[];
}

interface DependencyGraph {
  nodes: string[];
  edges: { from: string; to: string; type: string }[];
  circularDependencies: string[][];
}

interface DesignFlaw {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  impact: string;
  suggestion: string;
}

interface ArchitectureMetrics {
  complexity: number;
  maintainability: number;
  modularity: number;
  coupling: number;
  cohesion: number;
  testability: number;
}

interface Recommendation {
  category: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  benefits: string[];
  implementation: string;
}

export class ArchitectAgent {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    const analysis = await this.analyzeArchitecture(request.code, request.projectFiles);

    return {
      agentType: AgentType.ARCHITECT,
      success: true,
      data: analysis,
      suggestions: analysis.recommendations.map(r => r.title),
      timestamp: new Date()
    };
  }

  private async analyzeArchitecture(code: string, files?: ProjectFile[]): Promise<ArchitectureAnalysis> {
    const projectFiles = files || [{ path: 'main.js', content: code, language: 'javascript' }];

    // 1. Deterministic Analysis (Heuristics)
    const layerStructure = this.inferLayerStructure(projectFiles);
    const dependencies = this.analyzeDependencies(projectFiles);
    const heuristicPatterns = this.detectArchitecturalPatterns(projectFiles, layerStructure);
    const heuristicFlaws = this.findDesignFlaws(projectFiles, dependencies, layerStructure);
    const metrics = this.calculateMetrics(projectFiles, dependencies, layerStructure);

    // 2. AI Analysis (LLM)
    const aiAnalysis = await this.performAIAnalysis(projectFiles, layerStructure, dependencies, metrics);

    // 3. Merge Results
    const detectedPatterns = [...new Set([...heuristicPatterns, ...aiAnalysis.patterns])];
    const designFlaws = [...heuristicFlaws, ...aiAnalysis.flaws];
    const recommendations = [...this.generateRecommendations(heuristicFlaws, metrics, layerStructure), ...aiAnalysis.recommendations];

    // 4. Generate Document
    const designDocument = this.generateDesignDocument(
      detectedPatterns,
      layerStructure,
      dependencies,
      metrics,
      recommendations,
      aiAnalysis.executiveSummary
    );

    return {
      detectedPatterns,
      layerStructure,
      dependencies,
      designFlaws,
      metrics,
      recommendations,
      designDocument
    };
  }

  private async performAIAnalysis(
    files: ProjectFile[],
    layers: LayerInfo[],
    deps: DependencyGraph,
    metrics: ArchitectureMetrics
  ): Promise<{ patterns: string[], flaws: DesignFlaw[], recommendations: Recommendation[], executiveSummary: string }> {

    // Prepare context for LLM
    // Limit file content to avoid token limits (send first 100 lines of each file)
    const fileContext = files.map(f => ({
      path: f.path,
      contentPreview: f.content.split('\n').slice(0, 100).join('\n')
    }));

    const prompt = `
You are an expert Software Architect. Analyze the following project structure and metrics.
Provide a high-level architectural analysis.

Project Structure:
${JSON.stringify(layers, null, 2)}

Metrics:
${JSON.stringify(metrics, null, 2)}

Dependency Stats:
Nodes: ${deps.nodes.length}, Edges: ${deps.edges.length}, Cycles: ${deps.circularDependencies.length}

Files Preview:
${JSON.stringify(fileContext, null, 2)}

Task:
1. Identify architectural patterns (e.g., Microservices, Event-Driven, Clean Architecture).
2. Find subtle design flaws (e.g., Leaky Abstractions, Improper Error Handling, Security Risks).
3. Suggest high-impact recommendations.
4. Write a brief Executive Summary.

Return JSON format:
{
  "patterns": ["string"],
  "flaws": [{ "type": "string", "severity": "low|medium|high|critical", "location": "string", "description": "string", "impact": "string", "suggestion": "string" }],
  "recommendations": [{ "category": "string", "priority": "low|medium|high", "title": "string", "description": "string", "benefits": ["string"], "implementation": "string" }],
  "executiveSummary": "string"
}
`;

    try {
      const response = await this.llmService.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      return { patterns: [], flaws: [], recommendations: [], executiveSummary: "AI Analysis unavailable." };
    }
  }

  private inferLayerStructure(files: ProjectFile[]): LayerInfo[] {
    const layers: LayerInfo[] = [];
    const layerPatterns = [
      { name: 'Presentation', keywords: ['component', 'view', 'ui', 'page', 'screen'], responsibilities: ['User interface', 'User interaction'] },
      { name: 'API/Routes', keywords: ['route', 'controller', 'api', 'endpoint'], responsibilities: ['HTTP handling', 'Request routing'] },
      { name: 'Business Logic', keywords: ['service', 'manager', 'handler', 'use-case'], responsibilities: ['Business rules', 'Domain logic'] },
      { name: 'Data Access', keywords: ['repository', 'dao', 'model', 'entity', 'schema'], responsibilities: ['Data persistence', 'Database queries'] },
      { name: 'Infrastructure', keywords: ['config', 'util', 'helper', 'middleware'], responsibilities: ['Cross-cutting concerns', 'Utilities'] }
    ];

    for (const pattern of layerPatterns) {
      const matchingFiles = files.filter(f =>
        pattern.keywords.some(kw => f.path.toLowerCase().includes(kw))
      );

      if (matchingFiles.length > 0) {
        layers.push({
          name: pattern.name,
          files: matchingFiles.map(f => f.path),
          responsibilities: pattern.responsibilities
        });
      }
    }

    return layers;
  }

  private analyzeDependencies(files: ProjectFile[]): DependencyGraph {
    const nodes = files.map(f => f.path);
    const edges: { from: string; to: string; type: string }[] = [];

    // Extract imports/requires
    for (const file of files) {
      const imports = this.extractImports(file.content);
      for (const imp of imports) {
        const targetFile = this.resolveImport(imp, files);
        if (targetFile) {
          edges.push({
            from: file.path,
            to: targetFile,
            type: imp.startsWith('.') ? 'internal' : 'external'
          });
        }
      }
    }

    const circularDependencies = this.detectCircularDependencies(nodes, edges);

    return { nodes, edges, circularDependencies };
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];

    // ES6 imports
    const es6Regex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6Regex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // CommonJS requires
    const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = cjsRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private resolveImport(importPath: string, files: ProjectFile[]): string | null {
    if (!importPath.startsWith('.')) return null; // External dependency

    // Simple resolution - in production, use proper module resolution
    const normalized = importPath.replace(/^\.\//, '').replace(/^\.\.\//, '');
    return files.find(f => f.path.includes(normalized))?.path || null;
  }

  private detectCircularDependencies(nodes: string[], edges: { from: string; to: string }[]): string[][] {
    const circular: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = edges.filter(e => e.from === node).map(e => e.to);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          circular.push([...path.slice(cycleStart), neighbor]);
        }
      }

      recursionStack.delete(node);
    };

    for (const node of nodes) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return circular;
  }

  private detectArchitecturalPatterns(files: ProjectFile[], layers: LayerInfo[]): string[] {
    const patterns: string[] = [];

    // Detect MVC
    if (layers.some(l => l.name === 'Presentation') &&
      layers.some(l => l.name === 'API/Routes') &&
      layers.some(l => l.name === 'Data Access')) {
      patterns.push('MVC (Model-View-Controller)');
    }

    // Detect Layered Architecture
    if (layers.length >= 3) {
      patterns.push('Layered Architecture');
    }

    // Detect Repository Pattern
    if (files.some(f => f.path.includes('repository'))) {
      patterns.push('Repository Pattern');
    }

    // Detect Service Layer
    if (files.some(f => f.path.includes('service'))) {
      patterns.push('Service Layer Pattern');
    }

    // Detect Microservices indicators
    if (files.some(f => f.content.includes('express') || f.content.includes('fastify')) &&
      files.some(f => f.path.includes('api') || f.path.includes('route'))) {
      patterns.push('REST API Architecture');
    }

    return patterns.length > 0 ? patterns : [];
  }

  private findDesignFlaws(files: ProjectFile[], deps: DependencyGraph, layers: LayerInfo[]): DesignFlaw[] {
    const flaws: DesignFlaw[] = [];

    // Circular dependencies
    if (deps.circularDependencies.length > 0) {
      flaws.push({
        type: 'Circular Dependency',
        severity: 'high',
        location: deps.circularDependencies[0].join(' -> '),
        description: 'Circular dependencies detected between modules',
        impact: 'Makes code harder to test, maintain, and can cause runtime issues',
        suggestion: 'Break the cycle by introducing interfaces or dependency inversion'
      });
    }

    // God objects (files with too much code)
    for (const file of files) {
      const lines = file.content.split('\n').length;
      if (lines > 500) {
        flaws.push({
          type: 'God Object',
          severity: 'medium',
          location: file.path,
          description: `File has ${lines} lines - too large and likely doing too much`,
          impact: 'Reduces maintainability and violates Single Responsibility Principle',
          suggestion: 'Split into smaller, focused modules with clear responsibilities'
        });
      }
    }

    // Missing error handling
    for (const file of files) {
      if (file.content.includes('async') && !file.content.includes('try') && !file.content.includes('catch')) {
        flaws.push({
          type: 'Missing Error Handling',
          severity: 'high',
          location: file.path,
          description: 'Async code without try-catch blocks',
          impact: 'Unhandled promise rejections can crash the application',
          suggestion: 'Add try-catch blocks around async operations'
        });
      }
    }

    // Tight coupling (too many dependencies)
    for (const node of deps.nodes) {
      const outgoing = deps.edges.filter(e => e.from === node).length;
      if (outgoing > 10) {
        flaws.push({
          type: 'Tight Coupling',
          severity: 'medium',
          location: node,
          description: `Module depends on ${outgoing} other modules`,
          impact: 'High coupling makes changes risky and testing difficult',
          suggestion: 'Apply dependency injection and interface segregation'
        });
      }
    }

    // Missing layer separation
    if (layers.length < 3) {
      flaws.push({
        type: 'Poor Separation of Concerns',
        severity: 'medium',
        location: 'Project structure',
        description: 'Insufficient architectural layers detected',
        impact: 'Business logic mixed with presentation or data access',
        suggestion: 'Organize code into clear layers: presentation, business logic, data access'
      });
    }

    return flaws;
  }

  private calculateMetrics(files: ProjectFile[], deps: DependencyGraph, layers: LayerInfo[]): ArchitectureMetrics {
    // Complexity: based on file count and dependencies
    const avgDepsPerFile = deps.edges.length / Math.max(files.length, 1);
    const complexity = Math.min(10, avgDepsPerFile * 2);

    // Maintainability: inverse of complexity and file size
    const avgFileSize = files.reduce((sum, f) => sum + f.content.length, 0) / files.length;
    const maintainability = Math.max(0, 10 - (avgFileSize / 1000) - complexity / 2);

    // Modularity: based on layer structure
    const modularity = Math.min(10, layers.length * 2);

    // Coupling: based on dependency count
    const coupling = Math.min(10, avgDepsPerFile);

    // Cohesion: files per layer (higher is better)
    const avgFilesPerLayer = files.length / Math.max(layers.length, 1);
    const cohesion = Math.min(10, avgFilesPerLayer / 2);

    // Testability: based on coupling and modularity
    const testability = (modularity + (10 - coupling)) / 2;

    return {
      complexity: Math.round(complexity * 10) / 10,
      maintainability: Math.round(maintainability * 10) / 10,
      modularity: Math.round(modularity * 10) / 10,
      coupling: Math.round(coupling * 10) / 10,
      cohesion: Math.round(cohesion * 10) / 10,
      testability: Math.round(testability * 10) / 10
    };
  }

  private generateRecommendations(flaws: DesignFlaw[], metrics: ArchitectureMetrics, layers: LayerInfo[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Address critical flaws first
    const criticalFlaws = flaws.filter(f => f.severity === 'critical' || f.severity === 'high');
    for (const flaw of criticalFlaws) {
      recommendations.push({
        category: 'Critical Fix',
        priority: 'high',
        title: `Fix ${flaw.type}`,
        description: flaw.description,
        benefits: ['Improved stability', 'Reduced technical debt'],
        implementation: flaw.suggestion
      });
    }

    // Improve maintainability
    if (metrics.maintainability < 5) {
      recommendations.push({
        category: 'Maintainability',
        priority: 'high',
        title: 'Improve Code Maintainability',
        description: 'Current maintainability score is low',
        benefits: ['Easier to modify', 'Faster development', 'Reduced bugs'],
        implementation: 'Refactor large files, add documentation, improve naming'
      });
    }

    // Reduce coupling
    if (metrics.coupling > 7) {
      recommendations.push({
        category: 'Architecture',
        priority: 'medium',
        title: 'Reduce Module Coupling',
        description: 'Modules are too tightly coupled',
        benefits: ['Better testability', 'Easier to change', 'More reusable code'],
        implementation: 'Apply dependency injection, use interfaces, implement facade pattern'
      });
    }

    // Improve modularity
    if (metrics.modularity < 5) {
      recommendations.push({
        category: 'Structure',
        priority: 'medium',
        title: 'Enhance Modular Structure',
        description: 'Project lacks clear modular organization',
        benefits: ['Better organization', 'Easier navigation', 'Clear boundaries'],
        implementation: 'Organize into feature modules or domain-driven design structure'
      });
    }

    // Add testing infrastructure
    if (metrics.testability < 6) {
      recommendations.push({
        category: 'Testing',
        priority: 'medium',
        title: 'Improve Testability',
        description: 'Architecture makes testing difficult',
        benefits: ['Higher test coverage', 'Faster feedback', 'More confidence'],
        implementation: 'Use dependency injection, create test doubles, separate concerns'
      });
    }

    // SOLID principles
    recommendations.push({
      category: 'Best Practices',
      priority: 'low',
      title: 'Apply SOLID Principles',
      description: 'Ensure code follows SOLID design principles',
      benefits: ['Better design', 'More flexible', 'Easier to extend'],
      implementation: 'Review each principle: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion'
    });

    return recommendations;
  }

  private generateDesignDocument(
    patterns: string[],
    layers: LayerInfo[],
    deps: DependencyGraph,
    metrics: ArchitectureMetrics,
    recommendations: Recommendation[],
    executiveSummary: string
  ): string {
    const doc = `# Architecture Design Document

## Executive Summary
${executiveSummary || 'This document provides an analysis of the current system architecture, identifies design patterns, highlights potential issues, and recommends improvements.'}

## Detected Architecture Patterns
${patterns.map(p => `- ${p}`).join('\n')}

## Layer Structure
${layers.map(layer => `
### ${layer.name}
**Files:** ${layer.files.length}
**Responsibilities:**
${layer.responsibilities.map(r => `- ${r}`).join('\n')}
**Files in this layer:**
${layer.files.map(f => `- ${f}`).join('\n')}
`).join('\n')}

## Architecture Metrics
| Metric | Score (0-10) | Status |
|--------|--------------|--------|
| Complexity | ${metrics.complexity} | ${this.getStatus(metrics.complexity, true)} |
| Maintainability | ${metrics.maintainability} | ${this.getStatus(metrics.maintainability)} |
| Modularity | ${metrics.modularity} | ${this.getStatus(metrics.modularity)} |
| Coupling | ${metrics.coupling} | ${this.getStatus(metrics.coupling, true)} |
| Cohesion | ${metrics.cohesion} | ${this.getStatus(metrics.cohesion)} |
| Testability | ${metrics.testability} | ${this.getStatus(metrics.testability)} |

## Dependency Analysis
- **Total Modules:** ${deps.nodes.length}
- **Total Dependencies:** ${deps.edges.length}
- **Circular Dependencies:** ${deps.circularDependencies.length}
- **Average Dependencies per Module:** ${(deps.edges.length / deps.nodes.length).toFixed(2)}

## Recommendations

${recommendations.map((rec, idx) => `
### ${idx + 1}. ${rec.title} [${rec.priority.toUpperCase()} PRIORITY]
**Category:** ${rec.category}

**Description:** ${rec.description}

**Benefits:**
${rec.benefits.map(b => `- ${b}`).join('\n')}

**Implementation:**
${rec.implementation}
`).join('\n')}

## Next Steps
1. Address high-priority recommendations first
2. Implement architectural improvements incrementally
3. Add automated tests to prevent regressions
4. Document architectural decisions (ADRs)
5. Regular architecture reviews

---
*Generated by ArchitectAgent on ${new Date().toISOString()}*
`;

    return doc;
  }

  private getStatus(score: number, inverse: boolean = false): string {
    const threshold = inverse ?
      { good: 3, ok: 6 } :
      { good: 7, ok: 4 };

    if (inverse) {
      if (score <= threshold.good) return '✅ Good';
      if (score <= threshold.ok) return '⚠️ Needs Attention';
      return '❌ Poor';
    } else {
      if (score >= threshold.good) return '✅ Good';
      if (score >= threshold.ok) return '⚠️ Needs Attention';
      return '❌ Poor';
    }
  }
}
