import { Router } from 'express';
import { TesterAgent } from '../../../agents/src/tester-agent';
import { AgentType } from '../../../shared/src/types';

const router = Router();
const testerAgent = new TesterAgent();

router.post('/generate', async (req, res) => {
  try {
    const { code } = req.body;
    const result = await testerAgent.process({
      agentType: AgentType.TESTER,
      code,
      context: { action: 'generate' }
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/run', async (req, res) => {
  try {
    const { code, testCode } = req.body;
    const result = await testerAgent.process({
      agentType: AgentType.TESTER,
      code,
      context: { action: 'run', testCode }
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/full-cycle', async (req, res) => {
  try {
    const { code } = req.body;
    const result = await testerAgent.process({
      agentType: AgentType.TESTER,
      code,
      context: { action: 'full' }
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/fix', async (req, res) => {
  try {
    const { code, testCode, failures } = req.body;
    const result = await testerAgent.process({
      agentType: AgentType.TESTER,
      code,
      context: { action: 'fix', testCode, failures }
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
