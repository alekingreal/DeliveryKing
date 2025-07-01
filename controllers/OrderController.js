const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calcularFretePorPedido } = require('../utils/deliveryUtils');
const { iniciarFila, processarFila } = require('../utils/reservaManager');
const { getRouteDistanceAndDuration } = require('../utils/googleMapsUtils');
const { buscarCandidatosPorServico } = require('../utils/distribuidorInteligente');


// 🔧 CRIAÇÃO DE PEDIDO NORMAL (SEM ALTERAR FILA)
const createOrder = async (req, res) => {
  try {
    const {
      userId,
      total,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
      entregaVia,
      pickupLocation,
      dropoffLocation,
      restaurantId,
      moedaPagamento,
      valorPagoDK = 0,
      valorPagoReal = 0,
      valorPagoCartao = 0
    } = req.body;

    const distancia = await getRouteDistanceAndDuration(pickupLat, pickupLng, dropoffLat, dropoffLng)
      .then(res => res.distanceKm);

    const frete = calcularFretePorPedido(distancia);

    const order = await prisma.order.create({
      data: {
        total,
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        entregaVia,
        pickupLocation,
        dropoffLocation,
        deliveryFee: frete,
        status: 'pendente',
        statusCliente: 'aguardando',
        moedaPagamento: moedaPagamento || 'real',
        valorPagoDK,
        valorPagoReal,
        valorPagoCartao,
        user: { connect: { id: userId } },
        restaurant: { connect: { id: restaurantId } }
      }
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
};


// 🔧 NOVO: CRIAÇÃO DE PEDIDO HÍBRIDO (INDEPENDENTE DA FILA)
const createOrderHibrido = async (req, res) => {
  const userId = Number(req.headers['userid']);
  const { products, restaurantId, valorPagoDK, valorPagoReal, valorPagoCartao } = req.body;

  const produtosDoBanco = await prisma.product.findMany({ where: { id: { in: products } } });
  const precoTotal = produtosDoBanco.reduce((sum, p) => sum + p.price, 0);
  const totalInformado = valorPagoDK + valorPagoReal + valorPagoCartao;

  if (totalInformado !== precoTotal) {
    return res.status(400).json({ error: 'Soma dos pagamentos não fecha com o total do pedido.' });
  }

  const carteiraDK = await prisma.carteiraDK.findUnique({ where: { userId } });
  if (carteiraDK.saldo < valorPagoDK) {
    return res.status(400).json({ error: 'Saldo insuficiente em DK Coin' });
  }

  const carteiraReal = await prisma.carteiraReal.findUnique({ where: { userId } });
  if (carteiraReal.saldo < valorPagoReal) {
    return res.status(400).json({ error: 'Saldo insuficiente em saldo Real' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.carteiraDK.update({ where: { userId }, data: { saldo: { decrement: valorPagoDK } } });
    await tx.carteiraReal.update({ where: { userId }, data: { saldo: { decrement: valorPagoReal } } });

    await tx.order.create({
      data: {
        userId,
        restaurantId,
        total: precoTotal,
        valorPagoDK,
        valorPagoReal,
        valorPagoCartao,
        status: 'pendente',
        statusCliente: 'aguardando',
        entregaVia: 'manual',
        pickupLocation: 'Aguardando configuração',
        dropoffLocation: 'Aguardando configuração'
      }
    });
  });

  return res.json({ message: 'Pedido híbrido criado com sucesso' });
};


// 🔧 NÃO ALTERA NADA DA LÓGICA DE FILA:
const markOrderAsReady = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        restaurantId: true,
        pickupLat: true,
        pickupLng: true,
        entregaVia: true,
      }
    });

    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    const via = (order.entregaVia || '').trim().toLowerCase();

    if (via === 'delivery-king') {
      const { pickupLat, pickupLng } = order;
      const entregasDisponiveis = await prisma.delivery.findMany({
        where: {
          status: { in: ['pendente', 'em_rota'] },
          restaurantId: order.restaurantId,
          orders: { some: { entregaVia: 'delivery-king' } },
        },
        include: { orders: true },
      });

      const entregasValidas = entregasDisponiveis.filter(entrega =>
        entrega.orders.every(o => o.restaurantId === order.restaurantId)
      );

      for (const entrega of entregasValidas) {
        if (entrega.orders.length >= 10) continue;

        const origem = entrega.orders[0];
        const { distanceKm } = await getRouteDistanceAndDuration(
          origem.pickupLat,
          origem.pickupLng,
          pickupLat,
          pickupLng
        );

        if (distanceKm <= 3) {
          await prisma.order.update({
            where: { id: order.id },
            data: { deliveryId: entrega.id, statusCliente: 'pronto' },
          });
          return res.json({
            message: 'Pedido vinculado à entrega existente',
            entregaId: entrega.id,
          });
        }
      }

      const novaEntrega = await prisma.delivery.create({
        data: {
          status: 'pendente',
          fee: 0,
          distanceKm: 0,
          platformCommission: 0,
          tipoServico: 'delivery',
          localPartidaLat: order.pickupLat,
          localPartidaLng: order.pickupLng,
          restaurant: { connect: { id: order.restaurantId } },
          orders: { connect: { id: order.id } },
        }
      });

      const candidatos = await buscarCandidatosPorServico({
        tipoServico: 'delivery',
        lat: pickupLat,
        lng: pickupLng
      });

      const listaOrdenada = candidatos.map(e => e.id);
      const resultadoFila = iniciarFila(novaEntrega.id, listaOrdenada, processarFila);

      if (!resultadoFila) {
        return res.json({ message: 'Nenhum entregador elegível para reserva.' });
      }

      processarFila(novaEntrega.id);
      await prisma.order.update({ where: { id: order.id }, data: { statusCliente: 'pronto' } });

      return res.json({
        message: 'Pedido pronto e nova entrega criada',
        entregaId: novaEntrega.id,
        reservadoPara: resultadoFila.proximo,
      });
    }

    await prisma.order.update({ where: { id: order.id }, data: { statusCliente: 'pronto' } });
    res.json({ message: 'Pedido marcado como pronto (entrega manual)' });

  } catch (error) {
    console.error('Erro ao marcar pedido como pronto:', error);
    res.status(500).json({ message: 'Erro interno' });
  }
};


// 🔧 RESTANTE TUDO COMO ESTAVA
const completeDelivery = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.order.updateMany({
      where: { deliveryId: parseInt(id) },
      data: { statusCliente: 'entregue', status: 'entregue' }
    });

    await prisma.delivery.update({
      where: { id: parseInt(id) },
      data: { status: 'finalizada' }
    });

    res.json({ message: 'Entrega finalizada com sucesso' });
  } catch (error) {
    console.error('Erro ao completar entrega:', error);
    res.status(500).json({ message: 'Erro ao completar entrega' });
  }
};

const getPendingOrders = async (req, res) => {
  try {
    const pedidos = await prisma.order.findMany({
      where: { status: 'pendente' },
      include: { user: true }
    });
    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao buscar pedidos pendentes:', error);
    res.status(500).json({ message: 'Erro interno' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const pedidos = await prisma.order.findMany({
      include: { user: true, delivery: true }
    });
    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao buscar todos os pedidos:', error);
    res.status(500).json({ message: 'Erro interno' });
  }
};

const deleteAllUsers = async (req, res) => {
  try {
    await prisma.user.deleteMany({});
    res.json({ message: 'Todos os usuários foram deletados' });
  } catch (error) {
    console.error('Erro ao deletar usuários:', error);
    res.status(500).json({ message: 'Erro interno ao deletar usuários' });
  }
};


// 🔧 EXPORTANDO TUDO
module.exports = {
  createOrder,
  createOrderHibrido,
  markOrderAsReady,
  completeDelivery,
  getPendingOrders,
  getAllOrders,
  deleteAllUsers
};
