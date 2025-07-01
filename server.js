const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const path = require('path');
const { liberarEntregadoresPunidos } = require('./utils/punicaoUtils');
const { inicializarCliente } = require('./services/WhatsAppService');
const reserva = require('./utils/reservaPassageiroManager');
console.log('✅ iniciarReservaPassageiro é:', typeof reserva.iniciarReservaPassageiro);
const whatsappRoutes = require('./routes/whatsappRoutes');


// Rotas importadas (mantendo tudo igual como já tinha)
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const userRoutes = require('./routes/userRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const productRoutes = require('./routes/productRoutes');
const deliveryPersonRoutes = require('./routes/deliveryPersonRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const dkcoinRoutes = require('./routes/dkcoin.routes');
const orderDKRoutes = require('./routes/orderDK.routes');
const transferDKRoutes = require('./routes/transferDK.routes');
const supplyRoutes = require('./routes/supplyRoutes');
const cotacaoRoutes = require('./routes/cotacaoRoutes');
const authMiddleware = require('./middlewares/authMiddleware');
const atualizarCotacao = require('./scripts/atualizarCotacao');
const hubRoutes = require('./routes/hubRoutes');
const motoristaFrotaRoutes = require('./routes/motoristaFrotaRoutes');
const transferenciaRoutes = require('./routes/transferenciaRoutes');
const logisticaRoutes = require('./routes/logisticaRoutes');
const adminFinanceiroRoutes = require('./routes/adminFinanceiroRoutes');
const publicCotacaoRoutes = require('./routes/publicCotacaoRoutes');
const paramsTypeCast = require('./middlewares/paramsTypeCast');
const profileRoutes = require('./routes/profileRoutes');
const transferRoutes = require('./routes/transferRoutes');
const extratoRoutes = require('./routes/extratoRoutes');
const saqueRoutes = require('./routes/saqueRoutes');
const adminSaqueRoutes = require('./routes/adminSaqueRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminAuth = require('./middlewares/adminAuthMiddleware');
const adminRBAC = require('./middlewares/adminRBAC');
const recompraRoutes = require('./routes/recompra');
const financeiroEntregaRoutes = require('./routes/financeiroEntrega');
const realFinanceiroRoutes = require('./routes/realFinanceiro');
const userAuthRoutes = require('./routes/userAuthRoutes');
const deliveryPersonAuthRoutes = require('./routes/deliveryPersonAuthRoutes');
const webhookMercadoPago = require('./routes/webhook');
const pagamentoRoutes = require('./routes/pagamento');
const carteiraRoutes = require('./routes/carteiraRoutes');
const webhookWhatsApp = require('./routes/webhookWhatsApp');




// Configurações iniciais
dotenv.config();

if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.error('❌ Variável GOOGLE_MAPS_API_KEY não foi definida no .env');
  process.exit(1);
}

if (process.env.NODE_ENV !== 'production') {
  console.log('✅ Arquivo de ambiente carregado');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
global.io = io; // ⚠️ deixa o io global para usar nos seus outros arquivos

// Atualiza cotação
setInterval(() => {
  atualizarCotacao(io);
}, 60000);

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(paramsTypeCast);

// Registro de rotas
app.use('/auth', authRoutes);
app.use('/requests', requestRoutes);
app.use('/users', userRoutes);
app.use('/restaurants', restaurantRoutes);
app.use('/products', productRoutes);
app.use('/produtos', productRoutes);
app.use('/delivery-persons', deliveryPersonRoutes);
app.use('/orders', orderRoutes);
app.use('/deliveries', deliveryRoutes);
app.use('/dkcoin', dkcoinRoutes);
app.use('/orders-dk', orderDKRoutes);
app.use('/transferencias', transferDKRoutes);
app.use('/supply', supplyRoutes);
app.use('/cotacao', cotacaoRoutes);
app.use('/hubs', hubRoutes);
app.use('/motoristas', motoristaFrotaRoutes);
app.use('/transferencias-intermunicipais', transferenciaRoutes);
app.use('/logistica', logisticaRoutes);
app.use('/admin-financeiro', adminFinanceiroRoutes);
app.use('/public-cotacao', publicCotacaoRoutes);
app.use('/profile', profileRoutes);
app.use('/transferencia', transferRoutes);
app.use('/extrato', extratoRoutes);
app.use('/auth', userAuthRoutes);
app.use('/delivery-persons', deliveryPersonAuthRoutes);
app.use('/saques', saqueRoutes);
app.use('/admin/saques', adminSaqueRoutes);
app.use('/recompra', recompraRoutes);
app.use('/financeiro-entrega', financeiroEntregaRoutes);
app.use('/admin', adminRoutes);
app.use('/admin-auth', adminAuthRoutes);
app.use('/real-financeiro', realFinanceiroRoutes);
app.use('/webhook', webhookMercadoPago);
app.use('/pagamento', pagamentoRoutes);
app.use('/carteira', carteiraRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', authRoutes); // <- precisa estar registrado
app.use('/whatsapp', whatsappRoutes);
app.use('/', webhookWhatsApp);



// Rotas de teste
app.get('/', (req, res) => res.send('🚀 DeliveryKing API Online!'));
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Acesso autorizado!', user: req.user });
});

// WebSocket (Socket.IO)
io.on('connection', (socket) => {
  console.log('🟢 Novo socket conectado:', socket.id);

  socket.on('registrar_entregador', (entregadorId) => {
    console.log(`📡 Entregador ${entregadorId} registrado no socket`);
    socket.join(`entregador_${entregadorId}`);  // <-- usamos o namespace correto
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket desconectado:', socket.id);
  });
});

// Liberar entregadores punidos periodicamente
setInterval(() => {
  try {
    liberarEntregadoresPunidos();
  } catch (err) {
    console.error('❌ Erro ao liberar entregadores punidos:', err);
  }
}, 60 * 1000);

// Inicia servidor
const PORT = process.env.PORT || 3333;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
(async () => {
  await inicializarCliente(); // 🔒 Inicializa o cliente WhatsApp
})();