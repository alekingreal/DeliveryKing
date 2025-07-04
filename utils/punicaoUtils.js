console.log('📦 punicaoUtils carregado!');

const prisma = require('./prismaClient');

async function liberarEntregadoresPunidos() {
    console.log('🧪 Função liberarEntregadoresPunidos foi chamada');
    const agora = new Date();
    console.log("🔍 Checando desbloqueio de entregadores às", agora.toISOString());
  
    // ✅ 1. Liberar punidos cujo tempo já passou
    const punidosLiberados = await prisma.partner.updateMany({
      where: {
        blockUntil: {
          lte: agora,
          not: null,
        },
        available: false
      },
      data: {
        available: true,
        blockUntil: null
      }
    });
  
    // ✅ 2. Liberar travados sem punição (BUG fix permanente)
    const travadosCorrigidos = await prisma.partner.updateMany({
      where: {
        blockUntil: null,
        available: false
      },
      data: {
        available: true
      }
    });
  
    const total = punidosLiberados.count + travadosCorrigidos.count;
  
    if (total > 0) {
      console.log(`✅ Liberados ${total} entregadores: ${punidosLiberados.count} punidos + ${travadosCorrigidos.count} travados`);
    } else {
      console.log('🛑 Nenhum entregador para liberar.');
    }
  
    // (Opcional) listar ainda punidos
    const aindaPunidos = await prisma.partner.findMany({
      where: {
        blockUntil: { not: null }
      },
      select: {
        id: true,
        name: true,
        blockUntil: true,
        available: true
      }
    });
  
    console.log("⚠️ Entregadores ainda punidos no sistema:", JSON.stringify(aindaPunidos, null, 2));

  }
  

module.exports = {
  liberarEntregadoresPunidos
};
