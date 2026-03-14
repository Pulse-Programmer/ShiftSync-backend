import http from 'http';
import app from './app';
import { config } from './config';
import { initializeWebSocket } from './websocket';

const server = http.createServer(app);

initializeWebSocket(server);

server.listen(config.port, () => {
  console.log(`ShiftSync API running on port ${config.port} [${config.nodeEnv}]`);
});

export default server;
