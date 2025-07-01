// AuthController.js
const crypto = require('crypto');
const { sendRecoveryEmail } = require('../services/EmailService');

const recuperarAcesso = async (req, res) => {
  const { email, cpf } = req.body;

  try {
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, '');
      user = await prisma.user.findUnique({ where: { cpf: cleanCpf } });
    }

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutos

    await prisma.recoveryToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: expires
      }
    });

    const recoveryLink = `https://deliveryking.com.br/recuperar?token=${token}`;
    await sendRecoveryEmail(user.email, recoveryLink);

    return res.json({ message: 'Link de recuperação enviado por e-mail.' });
  } catch (error) {
    console.error('Erro em recuperarAcesso:', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
};
