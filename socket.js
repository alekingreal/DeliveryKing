const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Novo socket conectado: ${socket.id}`);

    socket.on('registrar_entregador', (entregadorId) => {
      console.log(`🛡️ Registrando entregador na sala: entregador_${entregadorId}`);
      socket.join(`entregador_${entregadorId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🚪 Socket desconectado: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io não inicializado!");
  }
  return io;
}

module.exports = { initSocket, getIO };
