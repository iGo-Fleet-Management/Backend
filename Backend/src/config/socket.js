const { Server } = require('socket.io');

let lastDriverLocation = null;

function setupSockets(server, app) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  let driverSocket = null;

  io.on('connection', (socket) => {
    console.log('Nova conexão:', socket.id);

    socket.on('registerDriver', () => {
      driverSocket = socket.id;
      console.log('Motorista registrado:', socket.id);
    });

    socket.on('driverLocation', (location) => {
      if (socket.id === driverSocket) {
        lastDriverLocation = location; // Armazena a localização
        socket.broadcast.emit('driverLocation', location);
      }
    });

    socket.on('disconnect', () => {
      if (socket.id === driverSocket) {
        console.log('Motorista desconectado');
        driverSocket = null;
      }
    });
  });

  // Endpoint HTTP para recuperar a última localização
  app.get('/api/last-driver-location', (req, res) => {
    if (lastDriverLocation) {
      res.json(lastDriverLocation);
    } else {
      res
        .status(404)
        .json({ error: 'Localização do motorista não disponível' });
    }
  });
}

module.exports = setupSockets;
