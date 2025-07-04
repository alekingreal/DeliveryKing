const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const InviteService = require('../services/InviteService');
const { gerarCodigo, salvarCodigo, verificarCodigo } = require('../utils/sendCode');
//const { sendCodeViaWhatsApp } = require('../services/WhatsAppService');
const { sendCodeMeta } = require('../services/MetaWhatsAppService');
const { verificarComprovanteVencido } = require('../utils/verificacaoResidencia');


const prisma = new PrismaClient();
const crypto = require('crypto');




const register = async (req, res) => {
  const { name, email, password, cpf, phone, city, invitedBy } = req.body;

  if (!name || !email || !password || !cpf || !phone) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios' });
  }

  try {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    const existingCpf = await prisma.user.findUnique({ where: { cpf } });
    const existingPhone = await prisma.user.findUnique({ where: { phone } });

    if (existingEmail || existingCpf || existingPhone) {
      return res.status(400).json({ message: 'E-mail, CPF ou telefone já cadastrados' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 Gerador de inviteCode único
    const gerarInviteCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    const inviteCode = gerarInviteCode();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        cpf,
        phone,
        city,
        inviteCode,
        invitedBy: invitedBy || null
      },
    });
    await prisma.carteiraDK.create({
      data: {
        userId: user.id,
        saldo: 0,
        updatedAt: new Date()
      }
    });
    

    // 🚀 Chama o InviteService pra aplicar o bônus de indicação
    await InviteService.aplicarBonusIndicacao(invitedBy, user.id);

    return res.status(201).json({ user });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', JSON.stringify(error, null, 2));
    return res.status(500).json({ message: 'Erro ao cadastrar usuário', error });
  }
};


const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ message: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao fazer login', error });
  }
};

const deleteAllUsers = async (req, res) => {
  try {
    await prisma.user.deleteMany();
    res.json({ message: '✅ Todos os usuários foram deletados com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuários:', error);
    res.status(500).json({ message: '❌ Erro ao deletar usuários' });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro ao listar usuários' });
  }
};

const loginEntregador = async (req, res) => {
  let { cpf, phone } = req.body;

  if (!cpf || !phone) {
    return res.status(400).json({ message: 'CPF e telefone são obrigatórios.' });
  }

  cpf = String(cpf).replace(/\D/g, '');
  phone = String(phone).replace(/\D/g, '');

  try {
    // 🔍 Primeiro busca o usuário com CPF + telefone
    const user = await prisma.user.findFirst({
      where: { cpf, phone }
    });

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado com CPF e telefone' });
    }

    // 🔗 Agora busca o Partner com base no userId
    const partner = await prisma.partner.findFirst({
      where: { userId: user.id },
      include: { user: true }
    });
    

    if (!partner) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }

    let precisaAtualizarEndereco = true;
    if (user.enderecoAtualizadoEm) {
      try {
        precisaAtualizarEndereco = verificarComprovanteVencido(user);
      } catch (err) {
        console.warn('⚠️ Erro ao verificar comprovante de residência:', err);
      }
    }
    console.log('✅ Login bem-sucedido para:', {
      userId: user.id,
      partnerId: partner.id,
      partnerName: partner.name,
      aprovado: partner.aprovado
    });
    const token = jwt.sign(
      { id: partner.id, name: partner.name || user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      precisaAtualizarEndereco,
      partner,
      user,
      aprovado: partner.aprovado
    });

  } catch (error) {
    console.error('🔴 Erro no loginEntregador:', JSON.stringify(error, null, 2));
    return res.status(500).json({
      message: 'Erro interno no servidor',
      error: error.message || 'Erro desconhecido',
      stack: error.stack || null
    });
  }
};


const updatePhone = async (req, res) => {
  const { userId } = req.params;
  const { newPhone } = req.body;

  try {
    const existing = await prisma.user.findFirst({
      where: {
        phone: newPhone,
        id: { not: parseInt(userId) }
      }
    });

    if (existing) return res.status(400).json({ message: 'Número já cadastrado' });

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        phoneTemp: newPhone
      },
    });
    
    

    const codigo = gerarCodigo();
    await salvarCodigo(userId, codigo); // ✅ AGORA CORRETO
    //await sendCodeViaWhatsApp(newPhone, codigo);
    await sendCodeMeta(phone, codigo);


    return res.status(200).json({ message: 'Código enviado para o novo número.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar número.' });
  }
};


const confirmarNovoTelefone = async (req, res) => {
  const { userId } = req.params;
  const { codigo } = req.body;

  try {
    const valido = await verificarCodigo(userId, codigo);
    if (!valido) return res.status(400).json({ message: 'Código inválido' });

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });

    if (!user.phoneTemp) {
      return res.status(400).json({ message: 'Nenhum número pendente para confirmação' });
    }

    // Atualiza o número principal e limpa o temp
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: user.phoneTemp,
        phoneTemp: null
      }
    });

    return res.status(200).json({ message: 'Telefone confirmado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao confirmar telefone' });
  }
};
const sendCode = async (req, res) => {
  try {
    let { cpf, phone } = req.body;
    if (!cpf || !phone) {
      return res.status(400).json({ message: 'CPF e telefone são obrigatórios.' });
    }

    cpf = cpf.replace(/\D/g, '');
    phone = phone.replace(/\D/g, '');

    // 🔍 Busca o usuário com CPF e telefone
    const user = await prisma.user.findFirst({
      where: { cpf, phone }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    // 🔗 Busca o partner usando o userId
    const partner = await prisma.partner.findFirst({ where: { userId: user.id } });


    if (!partner) {
      return res.status(404).json({ success: false, message: 'Entregador não encontrado' });
    }

    const codigo = gerarCodigo();
    await salvarCodigo(user.id, codigo);
    await sendCodeMeta(phone, codigo); // ✅ ou sendCodeViaWhatsApp

    return res.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar código:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao enviar código' });
  }
};





const verifyCode = async (req, res) => {
  try {
    let { cpf, phone, code } = req.body;
    if (!cpf || !phone || !code) {
      return res.status(400).json({ message: 'CPF, telefone e código são obrigatórios.' });
    }

    cpf = cpf.replace(/\D/g, '');
    phone = phone.replace(/\D/g, '');

    const user = await prisma.user.findFirst({
      where: { cpf, phone }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: user.id }
    });

    if (!partner) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }

    const isValid = await verificarCodigo(user.id, code);
    if (!isValid) {
      return res.status(401).json({ message: 'Código inválido ou expirado.' });
    }

    const token = jwt.sign(
      { id: partner.id, name: partner.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      partner: {
        id: partner.id,
        userId: partner.userId,
        name: partner.name,
        modoAtual: partner.modoAtual || null
      }
    });

  } catch (error) {
    console.error('Erro na verificação do código:', error);
    res.status(500).json({ message: 'Erro interno na verificação' });
  }
};


// AuthController.js
const validarToken = async (req, res) => {
  const { token } = req.query;

  try {
    const recovery = await prisma.recoveryToken.findUnique({ where: { token } });

    if (!recovery || recovery.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    const user = await prisma.user.findUnique({ where: { id: recovery.userId } });

    // (Opcional) Deleta o token após uso único
    await prisma.recoveryToken.delete({ where: { id: recovery.id } });

    // Retorna um token JWT válido pro app logar o usuário
    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    return res.json({ token: jwtToken, user });
  } catch (error) {
    console.error('Erro em validarToken:', error);
    return res.status(500).json({ message: 'Erro interno ao validar' });
  }
};
// POST /auth/recuperar-acesso
const recuperarAcesso = async (req, res) => {
  const { cpf } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { cpf } });
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    const token = require('crypto').randomBytes(32).toString('hex');
    await prisma.recoveryToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30) // 30 min
      }
    });

    const link = `http://192.168.1.75:3333/recuperar?token=${token}`;
    const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // ou outro provedor
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

await transporter.sendMail({
  from: '"DeliveryKing" <no-reply@deliveryking.com.br>',
  to: user.email,
  subject: '🔐 Recuperação de Acesso - DeliveryKing',
  html: `<p>Olá, ${user.name}!</p>
         <p>Recebemos uma solicitação para recuperar o acesso à sua conta.</p>
         <p>Clique no link abaixo para acessar o aplicativo:</p>
         <p><a href="${link}">${link}</a></p>
         <p>Esse link é válido por 30 minutos.</p>`
});


    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao gerar link de acesso' });
  }
};
const updateUserData = async (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email, city, address, bairro } = req.body;


  try {
    console.log('📦 Atualizando dados do usuário:', {
      name, email, city, address, bairro
    });
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        city,
        address,
        bairro,
        enderecoAtualizadoEm: new Date(),
        comprovanteResidenciaStatus: 'pendente'
      }
      
      
    });

    res.status(200).json({ message: 'Dados atualizados com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar dados do usuário' });
  }
};

module.exports = {
  register,
  login,
  deleteAllUsers,
  listUsers,
  loginEntregador,
  sendCode,        // ✅ ESSA LINHA PRECISA EXISTIR
  verifyCode,
  updatePhone,
  confirmarNovoTelefone,
  updateUserData,
  validarToken,
  recuperarAcesso    

};
