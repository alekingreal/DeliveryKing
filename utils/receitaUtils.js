const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Percentuais de comissão (ajustável)
const COMISSAO_COMPRA_DK = 0.005;  // 0.5% compra DK
const COMISSAO_GASTO_DK = 0.003;   // 0.3% gasto DK
const COMISSAO_PEDIDO_DK = 0.01;   // 1% sobre pedidos pagos com DK

async function registrarReceita(transaction, valorBase, tipoReceita) {
  let comissao = 0;

  if (tipoReceita === 'compra_dkcoin') comissao = valorBase * COMISSAO_COMPRA_DK;
  if (tipoReceita === 'gasto_dkcoin') comissao = valorBase * COMISSAO_GASTO_DK;
  if (tipoReceita === 'pedido_com_dkcoin') comissao = valorBase * COMISSAO_PEDIDO_DK;

  if (comissao > 0) {

     await transaction.ReceitaPlataformaDK.create({
      data: {
        tipo: tipoReceita,
        valor: comissao
      }
    });
    

    // Opcional: enviar também direto pra carteira master (ID: 999)
    await transaction.carteiraDK.upsert({
      where: { userId: 999 },
      update: { saldo: { increment: comissao } },
      create: { userId: 999, saldo: comissao }
    });
  }
}

module.exports = { registrarReceita };
