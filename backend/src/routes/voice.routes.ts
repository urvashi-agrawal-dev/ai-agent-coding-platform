import { Router } from 'express';
import { VoiceAgent } from '../services/voice-agent';

const router = Router();
const voiceAgent = new VoiceAgent();

router.post('/ask', async (req, res) => {
  try {
    const { question, code, projectFiles } = req.body;
    const result = await voiceAgent.processQuestion(question, code, projectFiles);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
