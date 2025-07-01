const express = require('express');
const router = express.Router();
const {
  createDeliveryPerson,
  updateLocation,
  getDeliveryPersonDeliveries,
  getDeliveryPersonBalance,
  getDashboardInfo,
  getAdvancedDashboardInfo,  // <-- adiciona essa linha
  getDeliveryPersonById,
  getAllDeliveryPersons,
  deleteAllDeliveryPersons,
  getPunishedDeliveryPersons,
  listarPunidos,
  ativarParaDelivery
} = require('../controllers/DeliveryPersonController');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const upload = require('../middlewares/uploadMiddleware'); // certifique-se que o caminho está correto
const { uploadAvatar } = require('../controllers/DeliveryPersonController');






// ✅ ROTA NOVA: Buscar deliveryPersonId pelo userId (agora blindada)
router.get('/by-user/:userId', async (req, res) => {
  const { userId } = req.params;

  const parsedUserId = parseInt(userId);
  if (isNaN(parsedUserId)) {
    return res.status(400).json({ error: 'userId inválido (não é um número).' });
  }

  try {
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { userId: parsedUserId }
    });

    if (!deliveryPerson) {
      return res.status(404).json({ error: 'Entregador não encontrado.' });
    }

    res.json({ deliveryPersonId: deliveryPerson.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// ✅ ROTA LISTAR TODOS PRIMEIRO!
router.get('/', getAllDeliveryPersons);

// Rotas específicas
router.get('/punished', getPunishedDeliveryPersons);
router.get('/currently-punished', listarPunidos);
router.delete('/all', deleteAllDeliveryPersons);
router.patch('/:id/ativar-delivery', ativarParaDelivery);

// Depois, rotas com :id (agora já protegidas pelo middleware de typecast)
router.get('/:id', getDeliveryPersonById);
router.patch('/:id/location', updateLocation);
router.get('/:id/deliveries', getDeliveryPersonDeliveries);
router.get('/:id/balance', getDeliveryPersonBalance);
router.get('/:id/dashboard', getDashboardInfo);
router.get('/:id/advanced-dashboard', getAdvancedDashboardInfo);


// Criar entregador
router.post('/', createDeliveryPerson);
router.post('/update-location', updateLocation);
router.post('/:id/avatar', upload.single('avatar'), uploadAvatar);
module.exports = router;
