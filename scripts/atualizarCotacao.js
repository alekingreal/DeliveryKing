const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dotenv = require('dotenv');
dotenv.config();

// Aqui simulamos o valor da cotação para teste
async function obterCotacaoMock() {
  return 1 + Math.random() * 0.1; // Ex: 1.03 ~ 1.10 (apenas pra simular)
}

async function atualizarCotacao(io) {
  try {
    const valorAtual = await obterCotacaoMock();

    const novaCotacao = await prisma.cotacaoDK.create({
      data: { valorAtual, variacao: 0 }
    });

    console.log('✅ Nova cotação inserida:', novaCotacao.valorAtual);

    // 🚀 Emitir para o Socket.io (se o io existir)
    if (io) {
      io.emit('nova_cotacao', {
        data: novaCotacao.data,
        valorAtual: novaCotacao.valorAtual
      });
      console.log('📡 Cotação emitida no socket');
    }

  } catch (err) {
    console.error('❌ Erro ao atualizar cotação:', err);
  }
}

// Exporta a função para ser usada no servidor
module.exports = atualizarCotacao;
