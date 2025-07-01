// backend/utils/sendCode.js
const { prisma } = require('../lib/prisma'); // ajuste o caminho conforme sua estrutura

function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // ex: "483920"
}

async function salvarCodigo(userId, codigo) {
  await prisma.codigoVerificacao.upsert({
    where: { userId: parseInt(userId) },
    update: { codigo },
    create: { userId: parseInt(userId), codigo },
  });
}

async function verificarCodigo(userId, codigo) {
  const registro = await prisma.codigoVerificacao.findUnique({
    where: { userId: parseInt(userId) },
  });
  return registro && registro.codigo === codigo;
}

module.exports = {
  gerarCodigo,
  salvarCodigo,
  verificarCodigo,
};
