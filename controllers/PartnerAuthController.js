const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const loginEntregador = async (req, res) => {
  try {
    let { cpf, phone } = req.body;
    if (!cpf || !phone) return res.status(400).json({ message: 'Campos obrigatórios' });

    cpf = String(cpf).replace(/\D/g, '');
    phone = String(phone).replace(/\D/g, '');

    const entregador = await prisma.partner.findFirst({ where: { cpf, phone } });
    if (!entregador) return res.status(401).json({ message: 'Entregador não encontrado' });

    const token = jwt.sign(
      { id: entregador.id, userId: entregador.userId, name: entregador.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'Login realizado com sucesso!',
      token,
      partner: {
        id: entregador.id,
        userId: entregador.userId,
        name: entregador.name
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno' });
  }
};

module.exports = { loginEntregador };
