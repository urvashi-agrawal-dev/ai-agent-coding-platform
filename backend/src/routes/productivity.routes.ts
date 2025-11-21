import { Router } from 'express';
import { ProductivityAgent } from '../../../agents/src/productivity-agent';
import { AgentType } from '../../../shared/src/types';

const router = Router();
const productivityAgent = new ProductivityAgent();

router.post('/readme', async (req, res) => {
  try {
    const { code, projectFiles, projectName, description } = req.body;
    const result = await productivityAgent.process({
      agentType: AgentType.PRODUCTIVITY,
      code,
      projectFiles,
      context: { action: 'readme', projectName, description }
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/docs', async (req, res) => {
  try {
    const { code, projectFiles } = req.body;
    const result = await productivityAgent.process({
      agentType: AgentType.PRODUCTIVITY,
      code,
      projectFiles,
      context: { action: 'docs' }
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/summary', async (req, res) => {
  try {
    const { code, projectFiles } = req.body;
    const result = await productivityAgent.process({
      agentType: AgentType.PRODUCTIVITY,
      code,
      projectFiles,
      context: { action: 'summary' }
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/diagrams', async (req, res) => {
  try {
    const { code, projectFiles } = req.body;
    const result = await productivityAgent.process({
      agentType: AgentType.PRODUCTIVITY,
      code,
      projectFiles,
      context: { action: 'diagrams' }
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/full', async (req, res) => {
  try {
    const { code, projectFiles, projectName, description } = req.body;
    const result = await productivityAgent.process({
      agentType: AgentType.PRODUCTIVITY,
      code,
      projectFiles,
      context: { projectName, description }
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
