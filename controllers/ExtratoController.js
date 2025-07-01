const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getExtrato = async (req, res) => {
  const userId = req.user.userId;
  const { periodo } = req.query;  // exemplo: 7, 30, 90 dias...

  let dataInicio = new Date();
  if (periodo) {
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));
  } else {
    dataInicio.setFullYear(dataInicio.getFullYear() - 1);  // por padrão, pega 1 ano inteiro
  }

  try {
    const transacoes = await prisma.transacaoDK.findMany({
      where: {
        userId,
        data: {
          gte: dataInicio
        }
      },
      orderBy: { data: 'desc' }
    });

    res.json(transacoes);
  } catch (err) {
    console.error('Erro ao buscar extrato:', err);
    res.status(500).json({ message: 'Erro interno.' });
  }
};
