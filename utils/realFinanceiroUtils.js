const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function registrarRecebimentoRealV3({
  pedidoId,
  valorProduto,
  valorFrete,
  entregadorUserId,
  lojistaUserId
}) {
  const taxaPlataformaProduto = 0.10; // 10% sobre o produto
  const taxaPlataformaFrete = 0.10;   // 10% sobre o frete

  const plataformaProduto = valorProduto * taxaPlataformaProduto;
  const plataformaFrete = valorFrete * taxaPlataformaFrete;

  const lojistaValor = valorProduto - plataformaProduto;
  const entregadorValor = valorFrete - plataformaFrete;

  const dataDisponivel = new Date();
  dataDisponivel.setDate(dataDisponivel.getDate() + 1);  // Exemplo: libera saque em 1 dia

  await prisma.$transaction(async (tx) => {
    // Recebível do Lojista
    await tx.Recebivel.create({
      data: {
        pedidoId,
        userIdRecebedor: lojistaUserId,
        valorBruto: valorProduto,
        taxas: plataformaProduto,
        valorLiquido: lojistaValor,
        status: 'pendente',
        dataDisponivel
      }
    });

    await tx.TransacaoReal.create({
      data: {
        userId: lojistaUserId,
        tipo: 'recebimento',
        valor: lojistaValor,
        descricao: `Recebimento pedido ${pedidoId} (lojista)`
      }
    });

    await tx.CarteiraReal.upsert({
      where: { userId: lojistaUserId },
      update: { saldo: { increment: lojistaValor } },
      create: { userId: lojistaUserId, saldo: lojistaValor }
    });

    // Recebível do Entregador
    await tx.Recebivel.create({
      data: {
        pedidoId,
        userIdRecebedor: entregadorUserId,
        valorBruto: valorFrete,
        taxas: plataformaFrete,
        valorLiquido: entregadorValor,
        status: 'pendente',
        dataDisponivel
      }
    });

    await tx.TransacaoReal.create({
      data: {
        userId: entregadorUserId,
        tipo: 'recebimento',
        valor: entregadorValor,
        descricao: `Recebimento pedido ${pedidoId} (entregador)`
      }
    });

    await tx.CarteiraReal.upsert({
      where: { userId: entregadorUserId },
      update: { saldo: { increment: entregadorValor } },
      create: { userId: entregadorUserId, saldo: entregadorValor }
    });

    // Receita da Plataforma
    await tx.ReceitaPlataformaDK.create({
      data: {
        tipo: 'real',
        origemId: pedidoId,
        valor: plataformaProduto + plataformaFrete
      }
    });
  });

  return {
    plataformaValor: plataformaProduto + plataformaFrete,
    entregadorValor,
    lojistaValor
  };
}

module.exports = { registrarRecebimentoRealV3 };
