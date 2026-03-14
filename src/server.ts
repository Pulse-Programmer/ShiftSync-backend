import http from 'http';
import app from './app';
import { config } from './config';

const server = http.createServer(app);

// Socket.io will be attached here later
// import { initializeWebSocket } from './websocket';
// initializeWebSocket(server);

server.listen(config.port, () => {
  console.log(`ShiftSync API running on port ${config.port} [${config.nodeEnv}]`);
});

export default server;
