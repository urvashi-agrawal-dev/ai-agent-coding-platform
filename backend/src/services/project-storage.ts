import * as fs from 'fs';
import * as path from 'path';

export interface SavedProject {
  id: string;
  name: string;
  code: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectStorage {
  private storageDir = path.join(process.cwd(), '.storage');
  private projectsFile = path.join(this.storageDir, 'projects.json');

  constructor() {
    // Ensure storage directory exists
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    // Initialize projects file if it doesn't exist
    if (!fs.existsSync(this.projectsFile)) {
      fs.writeFileSync(this.projectsFile, JSON.stringify([], null, 2));
    }
  }

  saveProject(id: string, name: string, code: string, language: string): SavedProject {
    const projects = this.loadProjects();
    const existingIndex = projects.findIndex(p => p.id === id);

    const project: SavedProject = {
      id,
      name,
      code,
      language,
      createdAt: existingIndex >= 0 ? projects[existingIndex].createdAt : new Date(),
      updatedAt: new Date()
    };

    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }

    fs.writeFileSync(this.projectsFile, JSON.stringify(projects, null, 2));
    return project;
  }

  loadProject(id: string): SavedProject | null {
    const projects = this.loadProjects();
    return projects.find(p => p.id === id) || null;
  }

  listProjects(): SavedProject[] {
    return this.loadProjects();
  }

  deleteProject(id: string): boolean {
    const projects = this.loadProjects();
    const filteredProjects = projects.filter(p => p.id !== id);
    
    if (filteredProjects.length === projects.length) {
      return false; // Project not found
    }

    fs.writeFileSync(this.projectsFile, JSON.stringify(filteredProjects, null, 2));
    return true;
  }

  private loadProjects(): SavedProject[] {
    try {
      const data = fs.readFileSync(this.projectsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }
}
