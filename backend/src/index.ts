import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import agentRoutes from './routes/agent.routes';
import fileRoutes from './routes/file.routes';
import sandboxRoutes from './routes/sandbox.routes';
import testRoutes from './routes/test.routes';
import docRoutes from './routes/doc.routes';
import debugRoutes from './routes/debug.routes';
import productivityRoutes from './routes/productivity.routes';
import voiceRoutes from './routes/voice.routes';
import executeRoutes from './routes/execute.routes';
import projectRoutes from './routes/project.routes';
import { setupWebSocket } from './websocket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/agents', agentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/sandbox', sandboxRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/productivity', productivityRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/code', executeRoutes);
app.use('/api/project', projectRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });
setupWebSocket(wss);

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
