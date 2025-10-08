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

// Prisma p/ /diag/prisma
const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

// Rotas
const whatsappRoutes = require('./routes/whatsappRoutes');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const userRoutes = require('./routes/userRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const productRoutes = require('./routes/productRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
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
const partnerAuthRoutes = require('./routes/partnerAuthRoutes');
const webhookMercadoPago = require('./routes/webhook');
const pagamentoRoutes = require('./routes/pagamento');
const carteiraRoutes = require('./routes/carteiraRoutes');
const webhookWhatsApp = require('./routes/webhookWhatsApp');

dotenv.config();

console.log('🟢 Boot DeliveryKing — commit:', process.env.RENDER_GIT_COMMIT || 'local');
if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.error('❌ GOOGLE_MAPS_API_KEY ausente');
  // não mata o processo em prod; apenas loga:
  // process.exit(1);
}
if (process.env.NODE_ENV !== 'production') {
  console.log('✅ Arquivo de ambiente carregado');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST','PATCH','PUT','DELETE'], credentials: false },
  transports: ['websocket', 'polling'],
});
global.io = io;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(paramsTypeCast);

// 🔍 HEALTH/DIAG – GARANTIR QUE EXISTEM
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'unknown',
    prisma: Prisma?.prismaVersion || 'unknown'
  });
});

app.get('/diag/prisma', async (req, res) => {
  try {
    const now = await prisma.$queryRaw`SELECT now() as now`;
    res.json({ ok: true, now, db: process.env.DATABASE_URL ? 'configured' : 'missing' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Rotas auxiliares
const aiIntegrationRoutes = require('./routes/aiIntegrationRoutes');
app.use('/ai', aiIntegrationRoutes);

// Registro de rotas principais
app.use('/auth', authRoutes);
app.use('/requests', requestRoutes);
app.use('/users', userRoutes);
app.use('/restaurants', restaurantRoutes);
app.use('/products', productRoutes);
app.use('/produtos', productRoutes);
app.use('/delivery-persons', partnerRoutes);
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
app.use('/delivery-persons', partnerAuthRoutes);
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
app.use('/', authRoutes);
app.use('/whatsapp', whatsappRoutes);
app.use('/', webhookWhatsApp);

// Rota raiz
app.get('/', (req, res) => res.send('🚀 DeliveryKing API Online!'));

// Socket.IO
io.on('connection', (socket) => {
  console.log('🟢 Socket conectado:', socket.id);

  // se preferir via auth:
  const { partnerId, role } = socket.handshake.auth || {};
  if (role === 'partner' && Number.isFinite(Number(partnerId))) {
    socket.join(`entregador_${Number(partnerId)}`);
    console.log('👤 partner join via auth:', partnerId);
  }

  socket.on('registrar_entregador', (entregadorId) => {
    if (Number.isFinite(Number(entregadorId))) {
      socket.join(`entregador_${Number(entregadorId)}`);
      console.log(`📡 Entregador ${entregadorId} registrado no socket`);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket desconectado:', socket.id);
  });
});

// Jobs
setInterval(() => {
  try {
    liberarEntregadoresPunidos();
  } catch (err) {
    console.error('❌ Erro ao liberar entregadores punidos:', err);
  }
}, 60 * 1000);

setInterval(() => {
  try {
    atualizarCotacao(io);
  } catch (err) {
    console.error('❌ Erro atualizarCotacao:', err);
  }
}, 60 * 1000);

// Start
const PORT = process.env.PORT || 3333;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// WhatsApp
(async () => {
  try {
    await inicializarCliente();
  } catch (e) {
    console.error('❌ WhatsApp init error:', e?.message);
  }
})();