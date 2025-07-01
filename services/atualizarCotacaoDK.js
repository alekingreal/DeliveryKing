const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Substitua por qualquer API de câmbio real no futuro
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

async function atualizarCotacaoDK() {
  try {
    const response = await axios.get(EXCHANGE_API_URL);
    const valorAtual = response.data.rates.BRL;

    await prisma.cotacaoDK.create({
      data: {
        valorAtual,
        variacao: 0, // podemos calcular variação depois
        data: new Date()
      }
    });

    console.log(`✅ Cotação DKCoin atualizada para R$ ${valorAtual}`);
  } catch (error) {
    console.error('❌ Erro ao atualizar cotação DK:', error);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = atualizarCotacaoDK;
