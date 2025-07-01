const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const RewardsService = require('./RewardsService');

exports.aplicarBonusIndicacao = async (invitedByCode, novoUserId) => {
  if (!invitedByCode) return;

  const convidador = await prisma.user.findUnique({
    where: { inviteCode: invitedByCode }
  });

  if (!convidador) {
    console.log('⚠ Código de convite inválido');
    return;
  }

  // Aplica os bônus de pontos (ajuste aqui os valores se quiser)
  await RewardsService.adicionarPontos(convidador.id, 200);
  await RewardsService.adicionarPontos(novoUserId, 100);

  console.log(`✅ Bônus aplicado: ${convidador.id} ganhou 200 pts, ${novoUserId} ganhou 100 pts`);
};
