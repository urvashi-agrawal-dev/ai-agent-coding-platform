import { Router } from 'express';
import { ProjectStorage } from '../services/project-storage';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const storage = new ProjectStorage();

// Save project
router.post('/save', async (req, res) => {
  try {
    const { id, name, code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required'
      });
    }

    const projectId = id || uuidv4();
    const projectName = name || `Project ${new Date().toISOString()}`;

    const project = storage.saveProject(projectId, projectName, code, language);

    res.json({
      success: true,
      project
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Load project
router.get('/load/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = storage.loadProject(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all projects
router.get('/list', async (req, res) => {
  try {
    const projects = storage.listProjects();

    res.json({
      success: true,
      projects
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete project
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = storage.deleteProject(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
