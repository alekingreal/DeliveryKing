const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const adminRBAC = (recurso, permissao) => {
  return async (req, res, next) => {
    const { id, role } = req.admin;

    if (role === 'MASTER') {
      return next();  // MASTER pode tudo
    }

    const permissaoEncontrada = await prisma.adminPermissao.findFirst({
      where: {
        adminId: id,
        recurso,
        [permissao]: true
      }
    });

    if (!permissaoEncontrada) {
      return res.status(403).json({ message: 'Acesso negado à funcionalidade' });
    }

    next();
  };
};

module.exports = adminRBAC;
