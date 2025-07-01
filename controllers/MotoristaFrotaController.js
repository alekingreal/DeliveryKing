const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const criarMotorista = async (req, res) => {
  const { nome, cpf, telefone, tipoVeiculo, cidadeBase } = req.body;

  const novoMotorista = await prisma.motoristaFrotaDK.create({
    data: { nome, cpf, telefone, tipoVeiculo, cidadeBase }
  });

  res.json(novoMotorista);
};

const listarMotoristas = async (req, res) => {
  const motoristas = await prisma.motoristaFrotaDK.findMany();
  res.json(motoristas);
};

module.exports = { criarMotorista, listarMotoristas };
