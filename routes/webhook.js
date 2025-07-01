const express = require('express');
const router = express.Router();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ACCESS_TOKEN = 'APP_USR-7689924941024242-061515-a42bb6a75500eea6cc27f9ace6a1f291-154237743';

router.post('/webhook-mercadopago', async (req, res) => {
  const body = req.body;

  if (body.type === "payment") {
    const pagamentoId = body.data.id;

    try {
      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${pagamentoId}`,
        {
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`
          }
        }
      );

      const pagamento = response.data;

      if (pagamento.status === "approved") {
        const orderId = parseInt(pagamento.external_reference);
        const valorBruto = pagamento.transaction_amount;

        console.log("✅ Pagamento aprovado na Order:", orderId);

        // Alimentar Tesouraria DK
        await prisma.recebivel.create({
          data: {
            pedidoId: orderId,
            userIdRecebedor: 999,
            valorBruto,
            taxas: valorBruto * 0.0349,
            valorLiquido: valorBruto * (1 - 0.0349),
            status: 'pendente',
            dataDisponivel: new Date(new Date().setDate(new Date().getDate() + 1)),
          }
        });

        await prisma.tesourariaDK.create({
          data: {
            entradaBruta: valorBruto,
            taxasGateway: valorBruto * 0.0349,
            comissaoPlataforma: valorBruto * 0.10,
            reservadoClientes: valorBruto * 0.8651,
            saldoLiquidoEmpresa: valorBruto * 0.10
          }
        });
      }

      res.sendStatus(200);
    } catch (err) {
      console.error("Erro no webhook:", err.response ? err.response.data : err);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(200);
  }
});

module.exports = router;
