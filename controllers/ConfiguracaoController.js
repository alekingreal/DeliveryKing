const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getConfiguracao = async (req, res) => {
  const config = await prisma.configuracaoSistema.findFirst();
  res.json(config);
};

exports.atualizarConfiguracao = async (req, res) => {
  const { cotacaoBase, limiteSaque, mensagemAviso } = req.body;

  const configExistente = await prisma.configuracaoSistema.findFirst();

  const atualizada = await prisma.configuracaoSistema.upsert({
    where: { id: configExistente?.id || 0 },
    update: { cotacaoBase, limiteSaque, mensagemAviso },
    create: { cotacaoBase, limiteSaque, mensagemAviso },
  });

  res.json(atualizada);
};

