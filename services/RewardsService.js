const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const definirNivel = (pontos) => {
  if (pontos >= 50000) return 'Master';
  if (pontos >= 10000) return 'Platina';
  if (pontos >= 5000) return 'Ouro';
  if (pontos >= 1000) return 'Prata';
  return 'Bronze';
};

exports.adicionarPontos = async (userId, pontosGanhos) => {
  let reward = await prisma.rewardsDK.findUnique({ where: { userId } });

  if (!reward) {
    reward = await prisma.rewardsDK.create({
      data: { userId, pontos: pontosGanhos, nivel: definirNivel(pontosGanhos) }
    });
  } else {
    const novosPontos = reward.pontos + pontosGanhos;
    const novoNivel = definirNivel(novosPontos);

    reward = await prisma.rewardsDK.update({
      where: { userId },
      data: { pontos: novosPontos, nivel: novoNivel }
    });
  }

  console.log(`🎯 User ${userId} agora tem ${reward.pontos} pontos e está no nível ${reward.nivel}`);
};
