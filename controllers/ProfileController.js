const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        CarteiraDK: true,
        deliveryProfile: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    res.json({
      id: user.id,
      name: user.name,
      city: user.city,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
      fotoPerfil: user.fotoPerfil || null, // futuro campo de foto
      carteira: {
        saldoDK: user.CarteiraDK?.saldo ?? 0,
      },
      deliveryProfile: user.deliveryProfile ?? null
    });

  } catch (err) {
    console.error('Erro getProfile:', err);
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, city, fotoPerfil } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, city, fotoPerfil }
    });

    res.json({ message: 'Perfil atualizado com sucesso', user });

  } catch (err) {
    console.error('Erro updateProfile:', err);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
};
