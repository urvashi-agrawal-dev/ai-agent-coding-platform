import { Router } from 'express';
import { DocumentationGenerator } from '../services/doc-generator';

const router = Router();
const docGen = new DocumentationGenerator();

router.post('/generate', async (req, res) => {
  try {
    const { projectFiles, projectName } = req.body;
    const docs = await docGen.generate(projectFiles, projectName);
    res.json(docs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
