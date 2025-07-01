const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const InviteService = require('../services/InviteService');
const prisma = new PrismaClient();

const register = async (req, res) => {
  const { name, email, password, cpf, phone, city, invitedBy } = req.body;

  if (!name || !email || !password || !cpf || !phone) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios' });
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { cpf }, { phone }] }
    });
    if (existing) return res.status(400).json({ message: 'Já cadastrado.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, cpf, phone, city, inviteCode, invitedBy }
    });

    await InviteService.aplicarBonusIndicacao(invitedBy, user.id);
    return res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao cadastrar' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Usuário não encontrado' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Senha incorreta' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: 'Erro no login' });
  }
};

module.exports = { register, login };
