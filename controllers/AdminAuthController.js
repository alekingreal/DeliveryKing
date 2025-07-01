const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login Admin
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  console.log("DEBUG loginAdmin -> email:", email);
  console.log("DEBUG loginAdmin -> password:", password);

  const admin = await prisma.adminUser.findUnique({
    where: { email },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      password: true  // <-- ESSA LINHA resolve todo o problema
    }
  });
  

  const passwordOk = await bcrypt.compare(password, admin.password);
  if (!passwordOk) return res.status(401).json({ message: 'Senha inválida' });

  const token = jwt.sign(
    { id: admin.id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // ✅ Carregar permissões do banco
  const permissoesRaw = await prisma.adminPermissao.findMany({
    where: { adminId: admin.id }
  });

  const permissoes = {};
  permissoesRaw.forEach(p => {
    permissoes[p.recurso] = { podeLer: p.podeLer, podeGravar: p.podeGravar };
  });

  res.json({ token, permissoes });
};

