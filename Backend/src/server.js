const http = require('http');
const app = require('./app');
const startBlacklistCleanup = require('./config/blacklistCleanup');
const startTripScheduler = require('./config/tripScheduler');
const PORT = process.env.PORT || 5000;

const setupSockets = require('./config/socket');

const server = http.createServer(app);

setupSockets(server);

startBlacklistCleanup();
startTripScheduler();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
