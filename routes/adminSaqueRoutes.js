const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AdminLogService = require('../services/AdminLogService');
const adminAuth = require('../middlewares/adminAuthMiddleware');

router.use(adminAuth); // protege as rotas

router.patch('/:id/aprovar', async (req, res) => {
  const saqueId = parseInt(req.params.id);
  const adminId = req.admin.id;

  try {
    await prisma.saqueDK.update({
      where: { id: saqueId },
      data: { status: 'APROVADO' }
    });

    await AdminLogService.registrar(adminId, 'SAQUE_APROVADO', `Saque ${saqueId} aprovado`);

    res.json({ message: 'Saque aprovado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao aprovar saque' });
  }
});

module.exports = router;
