import { Router } from 'express';
import multer from 'multer';
import { FileManager } from '../services/file-manager';

const router = Router();
const fileManager = new FileManager();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.array('files'), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const result = await fileManager.processUpload(files);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/list/:projectId', async (req, res) => {
  try {
    const files = await fileManager.listFiles(req.params.projectId);
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
