const { Server } = require('socket.io');

// Armazenamos tanto a localização quanto o timestamp
let lastDriverLocation = null;
let lastLocationTimestamp = null;

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

    // Quando um novo cliente se conecta, enviamos a última localização conhecida
    if (lastDriverLocation && lastLocationTimestamp) {
      // Verificar se a localização não está desatualizada (5 minutos)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (lastLocationTimestamp > fiveMinutesAgo) {
        socket.emit('driverLocation', lastDriverLocation);
      }
    }

    socket.on('registerDriver', () => {
      driverSocket = socket.id;
      console.log('Motorista registrado:', socket.id);
    });

    socket.on('driverLocation', (location) => {
      // Aceitamos a localização mesmo se não for o socket registrado anteriormente
      // isso resolve problemas quando o motorista reconecta com um novo ID
      if (location && location.lat && location.lng) {
        lastDriverLocation = location;
        lastLocationTimestamp = Date.now();

        // Atualizamos o ID do socket do motorista
        driverSocket = socket.id;

        // Transmitimos para todos os outros clientes
        socket.broadcast.emit('driverLocation', location);
      }
    });

    socket.on('disconnect', () => {
      if (socket.id === driverSocket) {
        console.log('Motorista desconectado');
        // Mantemos o último socket conhecido, mas marcamos como desconectado
        // driverSocket = null;
      }
    });
  });

  // Endpoint HTTP para recuperar a última localização
  app.get('/api/last-driver-location', (req, res) => {
    if (lastDriverLocation && lastLocationTimestamp) {
      // Verificar se a localização não está desatualizada (5 minutos)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (lastLocationTimestamp > fiveMinutesAgo) {
        return res.json(lastDriverLocation);
      }
      return res.status(404).json({
        error: 'Localização do motorista está desatualizada',
        lastUpdate: new Date(lastLocationTimestamp).toISOString(),
      });
    }

    res.status(404).json({ error: 'Localização do motorista não disponível' });
  });

  // Endpoint para motorista atualizar localização via HTTP (alternativa ao socket)
  app.post('/api/update-driver-location', (req, res) => {
    const { location } = req.body;

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ error: 'Dados de localização inválidos' });
    }

    lastDriverLocation = location;
    lastLocationTimestamp = Date.now();

    // Emitimos para todos os clientes conectados
    io.emit('driverLocation', location);

    res.json({ success: true });
  });
}

module.exports = setupSockets;
