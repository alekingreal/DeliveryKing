const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AdminLogService {
  static async registrar(adminId, acao, detalhes = '') {
    try {
      await prisma.adminLog.create({
        data: {
          adminId,
          acao,
          detalhes
        }
      });
    } catch (err) {
      console.error('Erro ao registrar log admin:', err);
    }
  }
}

module.exports = AdminLogService;
