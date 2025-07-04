const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

// Criar usuário
const createUser = async (req, res) => {
  const { name, email, password, cpf, phone, city } = req.body;

  if (!name || !email || !password || !cpf || !phone) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, cpf, phone, city }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ message: 'Erro ao cadastrar usuário', error });
  }
};

// Listar todos usuários
const listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro ao listar usuários', error });
  }
};

// Buscar um usuário por ID
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        city: true,
        avatarUrl: true,
        partner: true
      }
    });

    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar usuário', error });
  }
};

// Atualizar dados básicos do usuário
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, city } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { name, email, phone, city }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário', error });
  }
};

// Atualizar senha do usuário
const updatePassword = async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      

    });

    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.status(400).json({ message: 'Senha atual inválida' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro ao alterar senha', error });
  }
};

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  updatePassword
};
