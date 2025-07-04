const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path'); // ✅ necessário se for fazer manipulação extra com arquivos


// ✅ Criar entregador
const createPartner = async (req, res) => {
  try {
    const { userId, tipoVeiculo, placa } = req.body;
    let { modos } = req.body;

    console.log('🧾 Body:', req.body);
    console.log('📸 Files:', req.files);

    // Garante que `modos` seja array, mesmo que venha um único valor
    if (!Array.isArray(modos)) {
      modos = modos ? [modos] : [];
    }

    if (!userId || !tipoVeiculo || !placa || !req.files?.avatar || !req.files?.fotoVeiculo) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    }

    const avatarFile = req.files.avatar[0];
    const veiculoFile = req.files.fotoVeiculo[0];

    const baseUrl = 'https://deliveryking.onrender.com';

    const avatarUrl = `${baseUrl}/uploads/avatars/${avatarFile.filename}`;
    const fotoVeiculoUrl = `${baseUrl}/uploads/veiculos/${veiculoFile.filename}`;

    const novo = await prisma.partner.create({
      data: {
        userId: parseInt(userId), // aqui tem que ter certeza de que não está vindo ""
        tipoVeiculo,
        placa,
        avatarUrl,
        fotoVeiculoUrl,
        modoAtual: modos[0] || null,
        modosPermitidos: modos,
      },
    });

    return res.status(201).json(novo);
  } catch (error) {
    console.error('❌ Erro ao criar entregador:', error);
    return res.status(500).json({ message: 'Erro interno ao criar entregador.' });
  }
};



// ✅ Atualizar localização do entregador
const updateLocation = async (req, res) => {

  const { partnerId, lat, lng } = req.body;
  console.log(`📍 Atualizando localização de ${partnerId}: ${lat}, ${lng}`);
  if (!partnerId || !lat || !lng) {
   

    return res.status(400).json({ message: 'Campos obrigatórios: partnerId, lat, lng' });
  }

  try {
    const updated = await prisma.partner.update({
      where: { id: parseInt(partnerId) },
      data: {
        currentLat: parseFloat(lat),
        currentLng: parseFloat(lng),
        lastUpdatedAt: new Date()
      }
    });

    return res.json({ message: 'Localização atualizada!', entregador: updated });
  } catch (error) {
    console.error('Erro ao atualizar localização:', error);
    return res.status(500).json({ message: 'Erro interno ao atualizar localização' });
  }
};

const updateFotoVeiculo = async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) return res.status(400).json({ message: 'Arquivo ausente' });

  try {
    const fotoVeiculoUrl = `https://deliveryking.onrender.com/uploads/veiculos/${file.filename}`;

    await prisma.partner.update({
      where: { id: parseInt(id) },
      data: { fotoVeiculoUrl },
    });

    return res.json({ success: true, fotoVeiculoUrl });
  } catch (err) {
    console.error('Erro no upload de foto do veículo:', err);
    return res.status(500).json({ message: 'Erro no upload de foto do veículo', error: err.message });
  }
};



// ✅ Buscar entregas do entregador
const getPartnerDeliveries = async (req, res) => {
  const { id } = req.params;

  try {
    const deliveries = await prisma.delivery.findMany({
      where: { partnerId: parseInt(id) },
      orderBy: { id: 'desc' }
    });

    res.json(deliveries);
  } catch (error) {
    console.error('Erro ao buscar entregas do entregador:', error);
    res.status(500).json({ message: 'Erro ao buscar entregas' });
  }
};

// ✅ Consultar saldo do entregador
const getPartnerBalance = async (req, res) => {
  const { id } = req.params;

  try {
    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(id) },
      select: { balance: true }
    });

    if (!partner) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }

    res.json({ balance: partner.balance });
  } catch (error) {
    console.error('Erro ao buscar saldo do entregador:', error);
    res.status(500).json({ message: 'Erro ao buscar saldo' });
  }
};

const getDashboardInfo = async (req, res) => {
  const { id } = req.params;

  try {
    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(id) },
    });

    if (!partner) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }

    const [entregasPendentes, entregasFinalizadas, ganhos] = await Promise.all([
      prisma.delivery.count({
        where: {
          partnerId: parseInt(id),
          status: 'pendente',
        },
      }),
      prisma.delivery.count({
        where: {
          partnerId: parseInt(id),
          status: 'finalizada',
        },
      }),
      prisma.delivery.aggregate({
        _sum: {
          partnerPayout: true,
        },
        where: {
          partnerId: parseInt(id),
          status: 'finalizada',
        },
      }),
    ]);

    res.json({
      entregador: partner,
      resumo: {
        entregasPendentes,
        entregasFinalizadas,
        ganhosTotais: ganhos._sum.partnerPayout || 0,
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ message: 'Erro ao buscar dashboard do entregador' });
  }
};

const getPartnerById = async (req, res) => {
  const { id } = req.params;

  try {
    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(id) },
    });

    if (!partner) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }

    res.json(partner);
  } catch (error) {
    console.error('Erro ao buscar entregador:', error);
    res.status(500).json({ message: 'Erro ao buscar entregador' });
  }
};
// ✅ Listar todos os entregadores
const getAllPartners = async (req, res) => {
  try {
    const partners = await prisma.partner.findMany();
    res.json(partners);
  } catch (error) {
    console.error('Erro ao buscar entregadores:', error);
    res.status(500).json({ message: 'Erro ao buscar entregadores' });
  }
};

const deleteAllPartners = async (req, res) => {
  try {
    await prisma.partner.deleteMany({});
    res.json({ message: '✅ Todos os entregadores foram deletados com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar entregadores:', error);
    res.status(500).json({ message: 'Erro ao deletar entregadores' });
  }
};

const getPunishedPartners = async (req, res) => {
  try {
    const punished = await prisma.partner.findMany({
      where: {
        violations: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        violations: true,
        blockUntil: true,
        available: true,
        pending: true
      },
      orderBy: { violations: 'desc' }
    });

    res.json(punished);
  } catch (error) {
    console.error('Erro ao buscar entregadores punidos:', error);
    res.status(500).json({ message: 'Erro ao buscar entregadores punidos' });
  }
};

async function listarPunidos(req, res) {
  try {
    const agora = new Date();
    const punidos = await prisma.partner.findMany({
      where: {
        blockUntil: {
          gt: agora
        }
      },
      select: {
        id: true,
        name: true,
        blockUntil: true,
        punishmentLevel: true
      }
    });

    res.json(punidos);
  } catch (err) {
    console.error("❌ Erro ao listar entregadores punidos:", err);
    res.status(500).json({ error: 'Erro ao buscar entregadores punidos' });
  }
}
const ativarParaDelivery = async (req, res) => {
  const { id } = req.params;

  try {
    const entregador = await prisma.partner.update({
      where: { id: parseInt(id) },
      data: {
        aprovado: true,
        podeDelivery: true,
        modoAtual: 'delivery'
      }
    });

    res.json({ message: 'Entregador ativado para delivery!', entregador });
  } catch (error) {
    console.error('❌ Erro ao ativar entregador:', error);
    res.status(500).json({ message: 'Erro ao ativar entregador' });
  }
};
const getAdvancedDashboardInfo = async (req, res) => {
  const { id } = req.params;

  try {
    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(id) },
    });

    if (!partner) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }

    // Buscar saldo financeiro real (CarteiraDK)
    const carteira = await prisma.carteiraDK.findUnique({
      where: { userId: partner.userId },
    });

    const saldoDK = carteira?.saldo || 0;
    const saldoReal = carteira?.saldoReal || 0;

    // Gerar os últimos 7 dias
    const hoje = new Date();
    const dias = [];

    for (let i = 6; i >= 0; i--) {
      const dia = new Date();
      dia.setDate(hoje.getDate() - i);
      dias.push(new Date(dia.setHours(0, 0, 0, 0)));
    }

    // Agora vamos rodar tudo em paralelo
    const resultados = await Promise.all(dias.map(async (dia) => {
      const inicioDia = new Date(dia);
      const fimDia = new Date(dia);
      fimDia.setHours(23, 59, 59, 999);

      const [ganhos, entregas] = await Promise.all([
        prisma.delivery.aggregate({
          _sum: { partnerPayout: true },
          where: {
            partnerId: parseInt(id),
            status: 'finalizada',
            createdAt: { gte: inicioDia, lte: fimDia },
          },
        }),
        prisma.delivery.count({
          where: {
            partnerId: parseInt(id),
            status: 'finalizada',
            createdAt: { gte: inicioDia, lte: fimDia },
          },
        }),
      ]);

      return {
        ganho: ganhos._sum.partnerPayout || 0,
        entrega: entregas
      };
    }));

    const faturamentoSemanal = resultados.map(r => r.ganho);
    const entregasSemanais = resultados.map(r => r.entrega);

    const pagamentos = [
      { name: 'DK Coin', population: 60 },
      { name: 'Real', population: 30 },
      { name: 'Cartão', population: 10 }
    ];

    res.json({
      saldoDK,
      saldoReal,
      ganhosHoje: faturamentoSemanal[6],
      entregasHoje: entregasSemanais[6],
      faturamentoSemanal,
      entregasSemanais,
      pagamentos
    });

  } catch (error) {
    console.error('Erro ao buscar painel avançado:', error);
    res.status(500).json({ message: 'Erro ao buscar painel avançado do entregador' });
  }
};


const uploadAvatar = async (req, res) => {
  const { id } = req.params; // partner ID
  const file = req.file;

  if (!file) return res.status(400).json({ message: 'Arquivo ausente' });

  try {
    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(id) },
    });

    if (!partner || !partner.userId) {
      return res.status(404).json({ message: 'Entregador ou usuário não encontrado' });
    }

    const avatarUrl = `https://deliveryking.onrender.com/uploads/avatars/${file.filename}`;

    // Atualiza o campo avatarUrl da tabela USER, que é usada na Home/Login
    await prisma.user.update({
      where: { id: partner.userId },
      data: { avatarUrl },
    });

    return res.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('Erro no upload de avatar:', err);
    return res.status(500).json({ message: 'Erro no upload de avatar', error: err.message });
  }
};





module.exports = {
  ativarParaDelivery,
  createPartner,
  updateLocation,
  getPartnerDeliveries,
  getPartnerBalance,
  getDashboardInfo,
  getAdvancedDashboardInfo,
  getPartnerById,
  getAllPartners,
  deleteAllPartners,
  getPunishedPartners,
  listarPunidos,
  uploadAvatar,
  updateFotoVeiculo, // ✅ inclua aqui!

  
};
