const { criarPagamentoPix } = require('../services/pagamento/mercadoPagoService');

const criarPagamento = async (req, res) => {
  try {
    const { orderId, valor, descricao, nomeCliente, emailCliente } = req.body;

    const pagamento = await criarPagamentoPix(orderId, valor, descricao, nomeCliente, emailCliente);

    console.log("🧪 Resposta Mercado Pago:", JSON.stringify(pagamento, null, 2));

    res.json({
      qr_code_base64: pagamento.point_of_interaction.transaction_data.qr_code_base64,
      qr_code: pagamento.point_of_interaction.transaction_data.qr_code
    });

  } catch (err) {
    console.error('Erro ao criar pagamento:', err.response ? err.response.data : err);
    res.status(500).json({ error: 'Falha ao criar pagamento' });
  }
};

module.exports = { criarPagamento };
