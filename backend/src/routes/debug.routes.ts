import { Router } from 'express';
import { DebuggerAgent } from '../../../agents/src/debugger-agent';
import { AgentType } from '../../../shared/src/types';

const router = Router();
const debugAgent = new DebuggerAgent();

router.post('/analyze', async (req, res) => {
  try {
    const { code, language, autoFix } = req.body;
    
    const result = await debugAgent.process({
      agentType: AgentType.DEBUGGER,
      code,
      context: { language, autoFix }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/apply-patch', async (req, res) => {
  try {
    const { originalCode, patchedCode } = req.body;
    
    // In a real implementation, this would save the patched code
    // For now, just return confirmation
    res.json({
      success: true,
      message: 'Patch applied successfully',
      code: patchedCode
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
