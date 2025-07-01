const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// 🔐 Teu token de produção:
const ACCESS_TOKEN = 'APP_USR-7689924941024242-061515-a42bb6a75500eea6cc27f9ace6a1f291-154237743';

async function criarPagamentoPix(orderId, valor, descricao, nomeCliente, emailCliente) {
  const payment_data = {
    transaction_amount: valor,
    description: descricao,
    payment_method_id: "pix",
    payer: {
      email: emailCliente,
      first_name: nomeCliente
    },
    external_reference: orderId.toString()
  };

  const response = await axios.post(
    'https://api.mercadopago.com/v1/payments',
    payment_data,
    {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': uuidv4() // Aqui geramos o ID único por pagamento
      }
    }
  );

  return response.data;
}

module.exports = { criarPagamentoPix };
