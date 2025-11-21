import fs from 'fs/promises';
import path from 'path';

export class FileManager {
  private uploadDir = process.env.UPLOAD_DIR || './uploads';

  async processUpload(files: Express.Multer.File[]) {
    const processed = await Promise.all(
      files.map(async (file) => ({
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        content: await fs.readFile(file.path, 'utf-8')
      }))
    );
    return { files: processed, count: processed.length };
  }

  async listFiles(projectId: string) {
    const projectPath = path.join(this.uploadDir, projectId);
    try {
      const files = await fs.readdir(projectPath);
      return { files, projectId };
    } catch {
      return { files: [], projectId };
    }
  }
}
