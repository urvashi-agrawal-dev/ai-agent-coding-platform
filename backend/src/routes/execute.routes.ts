import { Router } from 'express';
import { CodeExecutor } from '../services/code-executor';

const router = Router();
const executor = new CodeExecutor();

router.post('/execute', async (req, res) => {
  try {
    const { code, language, input, timeout } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required'
      });
    }

    const result = await executor.execute({
      code,
      language,
      input,
      timeout
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      output: '',
      executionTime: 0,
      language: req.body.language || 'unknown'
    });
  }
});

export default router;
