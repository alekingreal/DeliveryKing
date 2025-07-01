const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const criarHub = async (req, res) => {
  const { cidade, estado, endereco, latitude, longitude } = req.body;

  const novoHub = await prisma.hubDK.create({
    data: { cidade, estado, endereco, latitude, longitude }
  });

  res.json(novoHub);
};

const listarHubs = async (req, res) => {
  const hubs = await prisma.hubDK.findMany();
  res.json(hubs);
};

module.exports = { criarHub, listarHubs };
