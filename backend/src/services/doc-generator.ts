import { Documentation, ProjectFile } from '../../../shared/src/types';

export class DocumentationGenerator {
  async generate(projectFiles: ProjectFile[], projectName: string): Promise<Documentation> {
    const structure = this.generateStructure(projectFiles);
    const apiDocs = this.generateApiDocs(projectFiles);
    
    return {
      projectName,
      description: `Auto-generated documentation for ${projectName}`,
      structure,
      apiDocs,
      generatedAt: new Date()
    };
  }

  private generateStructure(files: ProjectFile[]): string {
    return files.map(f => `- ${f.path}`).join('\n');
  }

  private generateApiDocs(files: ProjectFile[]): string {
    const apiFiles = files.filter(f => f.path.includes('api') || f.path.includes('routes'));
    return apiFiles.map(f => `## ${f.path}\n\n${this.extractFunctions(f.content)}`).join('\n\n');
  }

  private extractFunctions(content: string): string {
    const funcRegex = /(?:function|const|let|var)\s+(\w+)/g;
    const functions: string[] = [];
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      functions.push(`- ${match[1]}`);
    }
    return functions.join('\n');
  }
}
