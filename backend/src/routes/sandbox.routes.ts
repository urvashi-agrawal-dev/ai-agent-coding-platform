import { Router } from 'express';
import { SandboxExecutor } from '../services/sandbox-executor';

const router = Router();
const sandbox = new SandboxExecutor();

router.post('/execute', async (req, res) => {
  try {
    const { code, language, input } = req.body;
    const result = await sandbox.execute(code, language, input);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
