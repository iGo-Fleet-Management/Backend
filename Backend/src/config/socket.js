const { Server } = require('socket.io');

function setupSockets(server) {
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

    // Registro do Único Motorista
    socket.on('registerDriver', () => {
      driverSocket = socket.id;
      console.log('Motorista registrado:', socket.id);
    });

    // Atualizações de Localização
    socket.on('driverLocation', (location) => {
      if (socket.id === driverSocket) {
        // Envia para todos os outros (todos os passageiros)
        socket.broadcast.emit('driverLocation', location);
      }
    });

    // Tratamento de Desconexão
    socket.on('disconnect', () => {
      if (socket.id === driverSocket) {
        console.log('Motorista desconectado');
        driverSocket = null;
      }
    });
  });
}

module.exports = setupSockets;
