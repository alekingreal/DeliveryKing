const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path'); // ✅ necessário se for fazer manipulação extra com arquivos


// ✅ Criar entregador
const createDeliveryPerson = async (req, res) => {
  const {
    userId, name, cpf, phone, vehicle,
    locationLat, locationLng,
    available = true, aprovado = false,
    podeMotoTaxi = false, podeCarroTaxi = false, podeDelivery = false
  } = req.body;

  if (!name || !cpf || !phone || !vehicle || !locationLat || !locationLng) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes!' });
  }

  try {
    const newDeliveryPerson = await prisma.deliveryPerson.create({
      data: {
        userId,
        name,
        cpf,
        phone,
        vehicle,
        locationLat,
        locationLng,
        available,
        aprovado,
        podeMotoTaxi,
        podeCarroTaxi,
        podeDelivery,
        balance: 0
      }
    });

    res.status(201).json(newDeliveryPerson);
  } catch (error) {
    console.error('Erro ao criar entregador:', error);
    res.status(500).json({ message: 'Erro ao criar entregador' });
  }
};


// ✅ Atualizar localização do entregador
const updateLocation = async (req, res) => {

  const { deliveryPersonId, lat, lng } = req.body;
  console.log(`📍 Atualizando localização de ${deliveryPersonId}: ${lat}, ${lng}`);
  if (!deliveryPersonId || !lat || !lng) {
   

    return res.status(400).json({ message: 'Campos obrigatórios: deliveryPersonId, lat, lng' });
  }

  try {
    const updated = await prisma.deliveryPerson.update({
      where: { id: parseInt(deliveryPersonId) },
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




// ✅ Buscar entregas do entregador
const getDeliveryPersonDeliveries = async (req, res) => {
  const { id } = req.params;

  try {
    const deliveries = await prisma.delivery.findMany({
      where: { deliveryPersonId: parseInt(id) },
      orderBy: { id: 'desc' }
    });

    res.json(deliveries);
  } catch (error) {
    console.error('Erro ao buscar entregas do entregador:', error);
    res.status(500).json({ message: 'Erro ao buscar entregas' });
  }
};

// ✅ Consultar saldo do entregador
const getDeliveryPersonBalance = async (req, res) => {
  const { id } = req.params;

  try {
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { id: parseInt(id) },
      select: { balance: true }
    });

    if (!deliveryPerson) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }

    res.json({ balance: deliveryPerson.balance });
  } catch (error) {
    console.error('Erro ao buscar saldo do entregador:', error);
    res.status(500).json({ message: 'Erro ao buscar saldo' });
  }
};

const getDashboardInfo = async (req, res) => {
  const { id } = req.params;

  try {
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { id: parseInt(id) },
    });

    if (!deliveryPerson) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }

    const [entregasPendentes, entregasFinalizadas, ganhos] = await Promise.all([
      prisma.delivery.count({
        where: {
          deliveryPersonId: parseInt(id),
          status: 'pendente',
        },
      }),
      prisma.delivery.count({
        where: {
          deliveryPersonId: parseInt(id),
          status: 'finalizada',
        },
      }),
      prisma.delivery.aggregate({
        _sum: {
          deliveryPersonPayout: true,
        },
        where: {
          deliveryPersonId: parseInt(id),
          status: 'finalizada',
        },
      }),
    ]);

    res.json({
      entregador: deliveryPerson,
      resumo: {
        entregasPendentes,
        entregasFinalizadas,
        ganhosTotais: ganhos._sum.deliveryPersonPayout || 0,
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ message: 'Erro ao buscar dashboard do entregador' });
  }
};

const getDeliveryPersonById = async (req, res) => {
  const { id } = req.params;

  try {
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { id: parseInt(id) },
    });

    if (!deliveryPerson) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }

    res.json(deliveryPerson);
  } catch (error) {
    console.error('Erro ao buscar entregador:', error);
    res.status(500).json({ message: 'Erro ao buscar entregador' });
  }
};
// ✅ Listar todos os entregadores
const getAllDeliveryPersons = async (req, res) => {
  try {
    const deliveryPersons = await prisma.deliveryPerson.findMany();
    res.json(deliveryPersons);
  } catch (error) {
    console.error('Erro ao buscar entregadores:', error);
    res.status(500).json({ message: 'Erro ao buscar entregadores' });
  }
};

const deleteAllDeliveryPersons = async (req, res) => {
  try {
    await prisma.deliveryPerson.deleteMany({});
    res.json({ message: '✅ Todos os entregadores foram deletados com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar entregadores:', error);
    res.status(500).json({ message: 'Erro ao deletar entregadores' });
  }
};

const getPunishedDeliveryPersons = async (req, res) => {
  try {
    const punished = await prisma.deliveryPerson.findMany({
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
    const punidos = await prisma.deliveryPerson.findMany({
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
    const entregador = await prisma.deliveryPerson.update({
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
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { id: parseInt(id) },
    });

    if (!deliveryPerson) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }

    // Buscar saldo financeiro real (CarteiraDK)
    const carteira = await prisma.carteiraDK.findUnique({
      where: { userId: deliveryPerson.userId },
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
          _sum: { deliveryPersonPayout: true },
          where: {
            deliveryPersonId: parseInt(id),
            status: 'finalizada',
            createdAt: { gte: inicioDia, lte: fimDia },
          },
        }),
        prisma.delivery.count({
          where: {
            deliveryPersonId: parseInt(id),
            status: 'finalizada',
            createdAt: { gte: inicioDia, lte: fimDia },
          },
        }),
      ]);

      return {
        ganho: ganhos._sum.deliveryPersonPayout || 0,
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
  const { id } = req.params; // deliveryPerson ID
  const file = req.file;

  if (!file) return res.status(400).json({ message: 'Arquivo ausente' });

  try {
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { id: parseInt(id) },
    });

    if (!deliveryPerson || !deliveryPerson.userId) {
      return res.status(404).json({ message: 'Entregador ou usuário não encontrado' });
    }

    const avatarUrl = `http://192.168.1.75:3333/uploads/avatars/${file.filename}`;

    // Atualiza o campo avatarUrl da tabela USER, que é usada na Home/Login
    await prisma.user.update({
      where: { id: deliveryPerson.userId },
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
  createDeliveryPerson,
  updateLocation,
  getDeliveryPersonDeliveries,
  getDeliveryPersonBalance,
  getDashboardInfo,
  getAdvancedDashboardInfo,
  getDeliveryPersonById,
  getAllDeliveryPersons,
  deleteAllDeliveryPersons,
  getPunishedDeliveryPersons,
  listarPunidos,
  uploadAvatar, // ✅ inclua aqui!

  
};
