// 📦 DeliveryController.js atualizado com otimização de rota via Google Directions API (optimize:true)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

const { calcularDistanciaKm, calcularFretePorPedido } = require('../utils/deliveryUtils');
const { iniciarTimerDeRota, limparTimerDeRota } = require('./IntelligentDispatcher');
const { iniciarReserva, limparFila } = require('../utils/reservaManager');
const { liberarTravados } = require('./liberarTravados');
const { getRouteDistanceAndDuration } = require('../utils/googleMapsUtils');
const { getOptimizedOrder } = require('../utils/rotaUtils');
const { processarPagamentoEntrega, registrarRecebimentoRealV3 } = require('../utils/entregaFinanceiraUtils');
const { getTaxaCambioUSD_BRL } = require('../utils/cotacaoUtils');

const createOrder = async (req, res) => {
  try {
    const {
      tipoServico,
      tipoRota,
      maxPessoas,
      pickupLocation,
      dropoffLocation,
      localPartidaLat,
      localPartidaLng,
      destinoLat,
      destinoLng
    } = req.body;

    const novaEntrega = await prisma.delivery.create({
      data: {
        tipoServico,
        tipoRota,
        maxPessoas,
        pickupLocation,
        dropoffLocation,
        localPartidaLat,
        localPartidaLng,
        destinoLat,
        destinoLng,
        status: 'pendente'
      }
    });

    return res.status(201).json({ message: 'Entrega criada com sucesso!', entrega: novaEntrega });
  } catch (error) {
    console.error('Erro ao criar entrega:', error);
    return res.status(500).json({ message: 'Erro ao criar entrega' });
  }
};
const getDeliveryById = async (req, res) => {
  const { id } = req.params;
  try {
    const entrega = await prisma.delivery.findUnique({
      where: { id: parseInt(id) },
      include: {
        orders: true,
      }
    });

    if (!entrega) {
      return res.status(404).json({ error: 'Entrega não encontrada.' });
    }

    return res.json(entrega);
  } catch (error) {
    console.error('Erro ao buscar entrega:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};
const addOrderToDelivery = async (req, res) => {
  const { id } = req.params;
  const { orderId } = req.body;

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: parseInt(id) },
      include: { orders: true }
    });

    if (!delivery) return res.status(404).json({ message: 'Entrega não encontrada' });

    const order = await prisma.order.findUnique({ where: { id: parseInt(orderId) } });

    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    if (order.deliveryId) {
      return res.status(400).json({ message: 'Pedido já está vinculado a outra entrega' });
    }

    // Validação crítica
    if (delivery.orders.length > 0 && order.restaurantId !== delivery.orders[0].restaurantId) {
      return res.status(400).json({ message: 'Pedido pertence a restaurante diferente da entrega' });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { deliveryId: delivery.id }
    });

    res.json({ message: 'Pedido adicionado à entrega com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar pedido à entrega:', error);
    res.status(500).json({ message: 'Erro ao adicionar pedido à entrega' });
  }
};


const completeDelivery = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'ID de entrega inválido' });

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        partner: true,
        orders: true
      }
    });

    if (!delivery) return res.status(404).json({ message: 'Entrega não encontrada' });

    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: { status: 'finalizada' }
    });

    await prisma.order.updateMany({
      where: { deliveryId: id },
      data: { status: 'entregue' }
    });

    const updatedpartner = await prisma.partner.update({
      where: { id: delivery.partnerId },
      data: {
        available: true,
        balance: { increment: delivery.fee },
        pending: { decrement: delivery.fee }
      }
    });

    // Calcula financeiro DK Coin 🎯 (mantém seu fluxo DK atual)
    const totalReais = delivery.orders.reduce((acc, order) => acc + (order.deliveryFee || 0), 0);
    const cotacao = await prisma.cotacaoDK.findFirst({ orderBy: { data: 'desc' } });
    const taxaCambio = await getTaxaCambioUSD_BRL();
    const valorUSD = totalReais / taxaCambio;
    const valorDK = valorUSD / cotacao.valorAtual;

    await prisma.$transaction(async (tx) => {
      await tx.transacaoDK.create({
        data: {
          userId: delivery.partner.userId,
          tipo: 'pagamento_entrega',
          valorDK,
          valorReal: totalReais,
          descricao: `Pagamento por entrega #${delivery.id}`
        }
      });

      await tx.carteiraDK.upsert({
        where: { userId: delivery.partner.userId },
        update: { saldo: { increment: valorDK } },
        create: { userId: delivery.partner.userId, saldo: valorDK }
      });
    });

    // Agora roda o financeiro real 🎯
    for (const order of delivery.orders) {
      await registrarRecebimentoRealV3({
        pedidoId: order.id,
        valorProduto: order.total,
        valorFrete: order.deliveryFee ?? 0,
        entregadorUserId: delivery.partner.userId,
        lojistaUserId: order.restaurantId // ⚠️ aqui cuidado: ajustar caso tenha userId do restaurante
      });
    }

    res.json({
      message: 'Entrega finalizada e pagamentos (DK e Real) processados!',
      updatedDelivery,
      updatedpartner,
      financeiro: { totalReais, valorDK }
    });

  } catch (error) {
    console.error('Erro ao finalizar entrega:', error);
    res.status(500).json({ message: 'Erro ao finalizar entrega' });
  }
};

const getDeliveryHistory = async (req, res) => {
  const { id } = req.params;

  try {
    const history = await prisma.delivery.findMany({
      where: {
        partnerId: parseInt(id),
        status: 'finalizada',
      },
      orderBy: { id: 'desc' },
      include: { orders: true }
    });

    res.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico de entregas:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico de entregas' });
  }
};

const getAvailableDeliveries = async (req, res) => {
  await liberarTravados();
  console.log("🔁 Rodando liberarEntregadoresPunidos");

  const { lat, lng, partnerId } = req.query;

  if (!partnerId) {
    return res.status(400).json({ message: 'partnerId é obrigatório.' });
  }

  const entregadorId = parseInt(partnerId);
  const agora = new Date();

  try {
    // 🔒 Buscar entregas reservadas exclusivamente para esse entregador
    const entregasReservadas = await prisma.delivery.findMany({
      where: {
        status: 'pendente',
        partnerId: null,
        reservedpartnerId: entregadorId,
        reservedUntil: {
          gte: agora
        }
      },
      include: { orders: true }
    });

    if (entregasReservadas.length > 0) {
      console.log('📦 Entregas reservadas encontradas para o entregador:', entregadorId);
      return res.json(entregasReservadas);
    }

    // 🧭 Se não tem entrega reservada, exige localização
    if (!lat || !lng) {
      return res.status(400).json({ message: 'lat e lng são obrigatórios quando não há entregas reservadas.' });
    }

    const currentLat = parseFloat(lat);
    const currentLng = parseFloat(lng);

    // 🗂 Buscar entregas pendentes não atribuídas
    const deliveries = await prisma.delivery.findMany({
      where: {
        status: 'pendente',
        partnerId: null,
        reservedUntil: {
          lt: agora
        },
        orders: {
          some: {
            entregaVia: 'delivery-king',
            pickupLat: { not: null },
            pickupLng: { not: null }
          }
        }
      },
      include: { orders: true }
    });

    const nearby = deliveries.filter((delivery) => {
      const pedido = delivery.orders[0];
      if (!pedido || !pedido.pickupLat || !pedido.pickupLng) return false;

      const distance = calcularDistanciaKm(currentLat, currentLng, pedido.pickupLat, pedido.pickupLng);
      return distance <= 3;
    });

    return res.json(nearby);
  } catch (error) {
    console.error('❌ Erro ao buscar entregas disponíveis:', error);
    return res.status(500).json({ message: 'Erro ao buscar entregas disponíveis' });
  }
};


// ✅ controllers/DeliveryController.js

const acceptDelivery = async (req, res) => {
  const entregaId = parseInt(req.params.id);
  const { partnerId } = req.body;

  if (!partnerId) {
    return res.status(400).json({ message: 'partnerId é obrigatório' });
  }

  const parsedId = Number(partnerId);
  if (isNaN(parsedId)) {
    return res.status(400).json({ message: 'ID do entregador inválido' });
  }

  try {
    const updated = await prisma.delivery.update({
      where: { id: entregaId },
      data: {
        status: 'pendente',
        partner: {
          connect: { id: parsedId }
        }
      },
      include: { orders: true }
    });

    // ⏱️ INICIAR TIMER DE 5 MIN
    iniciarTimerDeRota(entregaId, parsedId);


    // 🔒 Garantia extra: limpar a fila manualmente
    limparFila(entregaId);

    res.json({ message: 'Entrega aceita com sucesso!', entrega: updated });
  } catch (error) {
    console.error('Erro ao aceitar entrega:', error);
    res.status(500).json({ message: 'Erro ao aceitar entrega', error: error.message });
  }
};






const startDeliveryRoute = async (req, res) => {
  const { id } = req.params;

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: parseInt(id) },
      include: {
        orders: true,
        partner: true
      }
    });

    if (!delivery) return res.status(404).json({ message: 'Entrega não encontrada' });
    if (!delivery.partnerId) {
      return res.status(400).json({ message: 'Nenhum entregador atribuído à entrega' });
    }

    limparTimerDeRota(delivery.partnerId);

    let distanciaTotal = 0;
    let feeTotal = 0;
    let plataformaTotal = 0;
    let entregadorTotal = 0;
    let durationTotalMin = 0;
    let rotaLink = null;
    let rotaPolyline = null;
    let rotaSteps = [];

    if (delivery.orders.length > 0) {
      const loja = {
        lat: delivery.localPartidaLat,
        lng: delivery.localPartidaLng
      };

      const { ordem, polyline, steps } = await getOptimizedOrder(loja, delivery.orders);
      rotaPolyline = polyline;
      rotaSteps = steps;

      const pedidosOrdenados = ordem.map(index => delivery.orders[index]);

      for (const pedido of pedidosOrdenados) {
        if (
          pedido.pickupLat == null || pedido.pickupLng == null ||
          pedido.dropoffLat == null || pedido.dropoffLng == null
        ) continue;

        const { distanceKm, durationMin } = await getRouteDistanceAndDuration(
          pedido.pickupLat, pedido.pickupLng,
          pedido.dropoffLat, pedido.dropoffLng
        );

        const frete = calcularFretePorPedido(distanceKm);
        const comissaoPedido = pedido.total * 0.10;
        const comissaoFrete = frete * 0.10;
        const pagamentoEntregador = frete - comissaoFrete;

        await prisma.order.update({
          where: { id: pedido.id },
          data: {
            platformCommission: comissaoPedido,
            deliveryFee: frete
          }
        });

        distanciaTotal += distanceKm;
        durationTotalMin += durationMin;
        feeTotal += frete;
        plataformaTotal += comissaoPedido + comissaoFrete;
        entregadorTotal += pagamentoEntregador;
      }

      const origem = `${delivery.localPartidaLat},${delivery.localPartidaLng}`;
      const waypoints = pedidosOrdenados.map(p => `${p.dropoffLat},${p.dropoffLng}`).join('|');
      const destinoFinal = pedidosOrdenados[pedidosOrdenados.length - 1];
      const destino = `${destinoFinal.dropoffLat},${destinoFinal.dropoffLng}`;
      rotaLink = `https://www.google.com/maps/dir/?api=1&origin=${origem}&destination=${destino}&travelmode=driving&waypoints=${waypoints}`;

    } else {
      const {
        localPartidaLat,
        localPartidaLng,
        destinoLat,
        destinoLng
      } = delivery;

      if (localPartidaLat && localPartidaLng && destinoLat && destinoLng) {
        const { distanceKm, durationMin } = await getRouteDistanceAndDuration(
          localPartidaLat,
          localPartidaLng,
          destinoLat,
          destinoLng
        );

        distanciaTotal = distanceKm;
        durationTotalMin = durationMin;
        feeTotal = calcularFretePorPedido(distanceKm);
        plataformaTotal = feeTotal * 0.10;
        entregadorTotal = feeTotal - plataformaTotal;
      }
    }

    const updated = await prisma.delivery.update({ 
      where: { id: delivery.id },
      data: {
        status: 'em_rota',
        distanceKm: distanciaTotal,
        fee: feeTotal,
        platformCommission: plataformaTotal,
        partnerPayout: entregadorTotal,
        tempoParaIniciar: durationTotalMin,
        partner: {
          update: {
            available: false,
            pending: { increment: entregadorTotal }
          }
        }
      }
    });
    console.log('📦 Polyline gerada:', rotaPolyline);
    return res.json({
      message: 'Rota iniciada com sucesso!',
      entrega: updated,
      rotaLink,
      rotaPolyline,
      rotaSteps
    });
  } catch (error) {
    console.error('Erro ao iniciar rota:', error);
    return res.status(500).json({ message: 'Erro ao iniciar rota' });
  }
};



const listAllDeliveries = async (req, res) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      orderBy: { id: 'desc' },
      include: {
        partner: true,
        orders: true
      }
    });

    res.json(deliveries);
  } catch (error) {
    console.error('Erro ao listar entregas:', error);
    res.status(500).json({ message: 'Erro ao listar entregas' });
  }
};

const deleteAllDeliveries = async (req, res) => {
  try {
    await prisma.order.updateMany({
      where: { deliveryId: { not: null } },
      data: { deliveryId: null }
    });

    await prisma.delivery.deleteMany({});
    res.json({ message: 'Todas as entregas foram apagadas com sucesso' });
  } catch (error) {
    console.error('Erro ao apagar entregas:', error);
    res.status(500).json({ message: 'Erro ao apagar entregas' });
  }
};
const cancelDeliveryRoute = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ message: 'Justificativa obrigatória para cancelar a rota.' });
  }

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: parseInt(id) },
      include: { orders: true }
    });

    if (!delivery) return res.status(404).json({ message: 'Entrega não encontrada' });

    await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        status: 'cancelada',
        cancelReason: reason
      }
    });

    await prisma.partner.update({
      where: { id: delivery.partnerId },
      data: {
        available: false,
        punishments: { increment: 1 }
      }
    });
    

    for (const pedido of delivery.orders) {
      await prisma.order.update({
        where: { id: pedido.id },
        data: { deliveryId: null }
      });

      const { criarEntregaEIniciarReserva } = require('../utils/IntelligentDispatcher');
      await criarEntregaEIniciarReserva(pedido);
    }

    res.json({ message: 'Rota cancelada com sucesso e pedidos retornaram à fila.' });
  } catch (error) {
    console.error('Erro ao cancelar rota:', error);
    res.status(500).json({ message: 'Erro ao cancelar rota.' });
  }
};

const cancelDelivery = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) return res.status(400).json({ message: 'Justificativa do cancelamento é obrigatória.' });

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: parseInt(id) },
      include: { orders: true, partner: true }
    });

    if (!delivery) return res.status(404).json({ message: 'Entrega não encontrada.' });

    // Punição progressiva
    


    if (!delivery.partner) {
      return res.status(400).json({ message: 'Entrega não está vinculada a nenhum entregador.' });
    }
    const violacoes = delivery.partner?.violations || 0;
    
    const minutosPunicao = (violacoes + 1) * 5;

    await prisma.partner.update({
      where: { id: delivery.partnerId },
      data: {
        available: false,
        punishments: { increment: 1 }
      }
    });
    

    // Cancelar entrega
    await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        status: 'cancelada',
        cancelReason: reason,
        partnerId: null,
        reservedpartnerId: null,
        reservedUntil: null
      }
    });

    // Liberar os pedidos e reiniciar reserva
    for (const pedido of delivery.orders) {
      await prisma.order.update({
        where: { id: pedido.id },
        data: { deliveryId: null }
      });
      iniciarReserva(pedido.id);

    }
    
    return res.json({ message: 'Entrega cancelada com sucesso e pedidos reprocessados.' });
  } catch (error) {
    console.error('Erro ao cancelar entrega:', error);
    return res.status(500).json({ message: 'Erro interno ao cancelar entrega.' });
  }
};
const getPendingDeliveries = async (req, res) => {
  const { partnerId } = req.query;

  if (!partnerId) {
    return res.status(400).json({ message: 'partnerId é obrigatório' });
  }

  const parsedId = parseInt(partnerId);
  if (isNaN(parsedId)) {
    return res.status(400).json({ message: 'ID do entregador inválido' });
  }

  try {
    const deliveries = await prisma.delivery.findMany({
      where: {
        partnerId: parsedId,
        status: 'pendente',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        orders: {
          where: {
            pickupLat: { not: null },
            pickupLng: { not: null },
            dropoffLat: { not: null },
            dropoffLng: { not: null },
          },
        },
      },
    });

    res.json(deliveries);
  } catch (error) {
    console.error('Erro ao buscar entregas pendentes:', error);
    res.status(500).json({ message: 'Erro ao buscar entregas pendentes' });
  }
};



const markOrderAsReady = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'pronto',
        statusCliente: 'pronto'
      }
    });

    res.json({ message: 'Pedido marcado como pronto', pedido: updatedOrder });
  } catch (error) {
    console.error('Erro ao marcar pedido como pronto:', error);
    res.status(500).json({ message: 'Erro interno ao marcar pedido como pronto.' });
  }
};


module.exports = {
  createOrder,
  completeDelivery,
  getDeliveryHistory,
  getAvailableDeliveries,
  acceptDelivery,
  addOrderToDelivery,
  startDeliveryRoute,
  listAllDeliveries,
  deleteAllDeliveries,
  cancelDelivery,
  cancelDeliveryRoute,
  getPendingDeliveries,
  markOrderAsReady,
  getDeliveryById
};
