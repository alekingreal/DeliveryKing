// controllers/RealFinanceiroController.js

const { registrarRecebimentoRealV2 } = require('../utils/realFinanceiroUtils');

const receberPagamentoRealista = async (req, res) => {
  const { pedidoId, valorProduto, valorFrete, entregadorUserId, lojistaUserId } = req.body;

  if (!pedidoId || !valorProduto || !valorFrete || !entregadorUserId || !lojistaUserId) {
    return res.status(400).json({ message: 'Dados incompletos.' });
  }

  try {
    const resultado = await registrarRecebimentoRealV2({
      pedidoId,
      valorProduto,
      valorFrete,
      entregadorUserId,
      lojistaUserId
    });

    res.json({
      message: 'Pagamento realista processado!',
      split: resultado
    });

  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
};

module.exports = { receberPagamentoRealista };
