async function validarLimiteSaque(userId, valorSolicitado) {
    const limite = await prisma.limiteSaqueDK.findUnique({ where: { userId } });
  
    if (!limite) {
      throw new Error("Limite não configurado.");
    }
  
    const hoje = new Date();
    const inicioDia = new Date(hoje.setHours(0,0,0,0));
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  
    const saquesHoje = await prisma.saqueDK.aggregate({
      where: {
        userId,
        criadoEm: { gte: inicioDia },
        status: { in: ['pendente', 'aprovado'] }
      },
      _sum: { valor: true }
    });
  
    const saquesMes = await prisma.saqueDK.aggregate({
      where: {
        userId,
        criadoEm: { gte: inicioMes },
        status: { in: ['pendente', 'aprovado'] }
      },
      _sum: { valor: true }
    });
  
    const totalHoje = (saquesHoje._sum.valor || 0) + valorSolicitado;
    const totalMes = (saquesMes._sum.valor || 0) + valorSolicitado;
  
    if (totalHoje > limite.limiteDiario) {
      throw new Error("Limite diário excedido.");
    }
  
    if (totalMes > limite.limiteMensal) {
      throw new Error("Limite mensal excedido.");
    }
  }
  