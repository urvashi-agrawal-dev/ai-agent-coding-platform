import { Router } from 'express';
import { AgentOrchestrator } from '../services/agent-orchestrator';

const router = Router();
const orchestrator = new AgentOrchestrator();

router.post('/execute', async (req, res) => {
  try {
    const result = await orchestrator.execute(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', (req, res) => {
  res.json({ agents: orchestrator.getAgentStatus() });
});

export default router;
