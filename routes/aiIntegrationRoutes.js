// backend/routes/aiIntegrationRoutes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AI_TOKEN = process.env.AI_TOKEN || null;

// 🔒 Middleware opcional de autenticação
function requireAiAuth(req, res, next) {
  if (!AI_TOKEN) return next();
  const token = req.header('X-AI-Token');
  if (!token || token !== AI_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// 🚫 Evitar duplicados (idempotência)
const recentKeys = new Map();
function requireIdempotency(req, res, next) {
  const key = req.header('Idempotency-Key');
  if (!key) return res.status(400).json({ error: 'Idempotency-Key obrigatório' });
  if (recentKeys.has(key)) return res.status(409).json({ error: 'Pedido duplicado' });
  recentKeys.set(key, Date.now());
  setTimeout(() => recentKeys.delete(key), 5 * 60 * 1000);
  next();
}

// 🚕 Endpoint principal chamado pela IA
router.post('/transport', requireAiAuth, requireIdempotency, async (req, res) => {
  try {
    const {
      serviceType,
      pickup = {},
      dropoff = {},
      passengers = 1,
      when = 'agora',
      notes = ''
    } = req.body || {};

    if (!serviceType || !['motoTaxi', 'carTaxi'].includes(serviceType)) {
      return res.status(400).json({ error: 'serviceType inválido (motoTaxi|carTaxi)' });
    }
    if (pickup.lat == null || pickup.lng == null) {
      return res.status(422).json({ error: 'pickup.lat/lng obrigatórios' });
    }
    if (dropoff.lat == null || dropoff.lng == null) {
      return res.status(422).json({ error: 'dropoff.lat/lng obrigatórios' });
    }

    const entrega = await prisma.delivery.create({
      data: {
        tipoServico: serviceType,
        tipoRota: 'direta',
        maxPessoas: passengers,
        pickupLocation: pickup.address || null,
        dropoffLocation: dropoff.address || null,
        localPartidaLat: pickup.lat,
        localPartidaLng: pickup.lng,
        destinoLat: dropoff.lat,
        destinoLng: dropoff.lng,
        status: 'pendente',
        notes,
        source: 'ai',
        agendamento: when === 'agora' ? null : new Date(when)
      }
    });

    res.status(201).json({
      message: 'Solicitação recebida pela IA e criada no DeliveryKing',
      entrega: { id: entrega.id, status: entrega.status }
    });
  } catch (err) {
    console.error('Erro na rota /ai/transport:', err);
    res.status(500).json({ error: 'Erro ao criar transporte via IA' });
  }
});

module.exports = router;