import { WebSocketServer, WebSocket } from 'ws';

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        handleMessage(ws, data);
      } catch (error) {
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
}

function handleMessage(ws: WebSocket, data: any) {
  // Handle real-time debug reports and updates
  if (data.type === 'debug') {
    ws.send(JSON.stringify({
      type: 'debug-report',
      data: { issues: [], severity: 'low', timestamp: new Date() }
    }));
  }
}
