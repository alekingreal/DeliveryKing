const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ Buscar saldo da Carteira DK
const getCarteiraDK = async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const carteira = await prisma.carteiraDK.findUnique({ where: { userId } });
    if (!carteira) {
      return res.status(404).json({ message: 'Carteira DK não encontrada' });
    }
    res.json(carteira);
  } catch (error) {
    console.error('Erro ao buscar Carteira DK:', error);
    res.status(500).json({ message: 'Erro interno' });
  }
};

// ✅ Buscar saldo da Carteira Real
const getCarteiraReal = async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const carteira = await prisma.carteiraReal.findUnique({ where: { userId } });
    if (!carteira) {
      return res.status(404).json({ message: 'Carteira Real não encontrada' });
    }
    res.json(carteira);
  } catch (error) {
    console.error('Erro ao buscar Carteira Real:', error);
    res.status(500).json({ message: 'Erro interno' });
  }
};

// ✅ Ajustar saldo DK (somente para testes/admin)
const ajustarSaldoDK = async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { novoSaldo } = req.body;
  try {
    const carteira = await prisma.carteiraDK.update({
      where: { userId },
      data: { saldo: novoSaldo }
    });
    res.json(carteira);
  } catch (error) {
    console.error('Erro ao ajustar Carteira DK:', error);
    res.status(500).json({ message: 'Erro interno' });
  }
};

// ✅ Ajustar saldo Real (somente para testes/admin)
const ajustarSaldoReal = async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { novoSaldo } = req.body;
  try {
    const carteira = await prisma.carteiraReal.update({
      where: { userId },
      data: { saldo: novoSaldo }
    });
    res.json(carteira);
  } catch (error) {
    console.error('Erro ao ajustar Carteira Real:', error);
    res.status(500).json({ message: 'Erro interno' });
  }
};

module.exports = {
  getCarteiraDK,
  getCarteiraReal,
  ajustarSaldoDK,
  ajustarSaldoReal
};
