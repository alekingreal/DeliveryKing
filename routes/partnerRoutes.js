const express = require('express');
const router = express.Router();
const {
  createPartner,
  updateLocation,
  getPartnerDeliveries,
  getPartnerBalance,
  getDashboardInfo,
  getAdvancedDashboardInfo,  // <-- adiciona essa linha
  getPartnerById,
  getAllPartners,
  deleteAllPartners,
  getPunishedPartners,
  listarPunidos,
  ativarParaDelivery,
  uploadAvatar,
  updateFotoVeiculo,
} = require('../controllers/PartnerController');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const upload = require('../middlewares/uploadMiddleware'); // certifique-se que o caminho está correto






// ✅ ROTA NOVA: Buscar partnerId pelo userId (agora blindada)
router.get('/by-user/:userId', async (req, res) => {
  const { userId } = req.params;

  const parsedUserId = parseInt(userId);
  if (isNaN(parsedUserId)) {
    return res.status(400).json({ error: 'userId inválido (não é um número).' });
  }

  try {
    const partner = await prisma.partner.findUnique({
      where: { userId: parsedUserId }
    });

    if (!partner) {
      return res.status(404).json({ error: 'Entregador não encontrado.' });
    }

    res.json({ partnerId: partner.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// ✅ ROTA LISTAR TODOS PRIMEIRO!
router.get('/', getAllPartners);

// Rotas específicas
router.get('/punished', getPunishedPartners);
router.get('/currently-punished', listarPunidos);
router.delete('/all', deleteAllPartners);
router.patch('/:id/ativar-delivery', ativarParaDelivery);

// Depois, rotas com :id (agora já protegidas pelo middleware de typecast)
router.get('/:id', getPartnerById);
router.patch('/:id/location', updateLocation);
router.get('/:id/deliveries', getPartnerDeliveries);
router.get('/:id/balance', getPartnerBalance);
router.get('/:id/dashboard', getDashboardInfo);
router.get('/:id/advanced-dashboard', getAdvancedDashboardInfo);


// Criar entregador
router.post(
  '/',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'fotoVeiculo', maxCount: 1 },
  ]),
  createPartner
);

router.post('/update-location', updateLocation);
router.post('/:id/avatar', upload.single('avatar'), uploadAvatar);
router.post('/:id/foto-veiculo', upload.single('fotoVeiculo'), updateFotoVeiculo);

module.exports = router;
