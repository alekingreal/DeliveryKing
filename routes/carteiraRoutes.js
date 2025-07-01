// routes/carteiraRoutes.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ A sua rota existente (mantemos intacta)
router.get('/:userId/saldo', async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (!userId) return res.status(400).json({ error: 'userId inválido' });

  const carteiraDK = await prisma.carteiraDK.findUnique({ where: { userId } });
  const carteiraReal = await prisma.carteiraReal.findUnique({ where: { userId } });

  res.json({
    saldoDK: carteiraDK?.saldo || 0,
    saldoReal: carteiraReal?.saldo || 0
  });
});

// 🔧 ROTA GET - buscar carteira DK isolada
router.get('/dk/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  const carteira = await prisma.carteiraDK.findUnique({ where: { userId } });
  if (!carteira) return res.status(404).json({ message: 'Carteira DK não encontrada' });
  res.json(carteira);
});

// 🔧 ROTA GET - buscar carteira Real isolada
router.get('/real/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  const carteira = await prisma.carteiraReal.findUnique({ where: { userId } });
  if (!carteira) return res.status(404).json({ message: 'Carteira Real não encontrada' });
  res.json(carteira);
});

// 🔧 PATCH - ajustar saldo DK (uso em teste/admin)
router.patch('/dk/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { novoSaldo } = req.body;
  const carteira = await prisma.carteiraDK.update({
    where: { userId },
    data: { saldo: novoSaldo }
  });
  res.json(carteira);
});

// 🔧 PATCH - ajustar saldo Real (uso em teste/admin)
router.patch('/real/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { novoSaldo } = req.body;
  const carteira = await prisma.carteiraReal.update({
    where: { userId },
    data: { saldo: novoSaldo }
  });
  res.json(carteira);
});

module.exports = router;
