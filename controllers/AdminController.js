const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Parser } = require('json2csv');

// ✅ Resumo geral
exports.getOverview = async (req, res) => {
  try {
    const totalUsuarios = await prisma.user.count();
    const totalTransacoes = await prisma.transacaoDK.count();
    const supply = await prisma.supplyDK.findFirst();

    res.json({
      totalUsuarios,
      totalTransacoes,
      totalSupply: supply?.totalSupply || 0,
      receitaMaster: supply?.reserved || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

// ✅ Listagem de usuários
exports.listarUsuarios = async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, cpf: true, inviteCode: true, invitedBy: true }
  });
  res.json(users);
};

// ✅ Listagem de saques
exports.listarSaques = async (req, res) => {
  const saques = await prisma.saqueDK.findMany({
    include: { User: true },
    orderBy: { criadoEm: 'desc' }
  });
  res.json(saques);
};

// ✅ Listagem de transferências
exports.listarTransferencias = async (req, res) => {
  const transacoes = await prisma.transacaoDK.findMany({
    orderBy: { data: 'desc' }
  });
  res.json(transacoes);
};

// ✅ Listagem de rewards
exports.listarRewards = async (req, res) => {
  const rewards = await prisma.rewardsDK.findMany({
    include: { User: true }
  });
  res.json(rewards);
};

// ✅ Visualizar Supply
exports.verSupply = async (req, res) => {
  const supply = await prisma.supplyDK.findFirst();
  res.json(supply);
};


// ✅ Atualizar Supply (agora só permite alterar reserved, mantendo totalSupply fixo)
exports.atualizarSupply = async (req, res) => {
  const { reserved } = req.body;  // ⬅ só deixamos o reserved editável
  try {
    await prisma.supplyDK.updateMany({
      data: { reserved }
    });
    res.json({ message: 'Reserved atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar reserved' });
  }
};



// ✅ Log geral de transações
exports.logTransacoes = async (req, res) => {
  try {
    const transacoes = await prisma.transacaoDK.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { data: 'desc' }
    });
    res.json(transacoes);
  } catch (err) {
    console.error('Erro ao buscar logs de transação:', err);
    res.status(500).json({ message: 'Erro ao buscar logs de transação' });
  }
};





// ✅ Log de atividades administrativas (corrigido conflito)
exports.logAtividades = async (req, res) => {
  try {
    const logs = await prisma.adminLog.findMany({
      include: { admin: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar logs administrativos' });
  }
};

// ✅ Buscar usuário (filtro inteligente)
exports.buscarUsuario = async (req, res) => {
  const termo = req.query.q;
  try {
    const filtros = [
      { name: { contains: termo, mode: 'insensitive' } },
      { email: { contains: termo, mode: 'insensitive' } },
      { cpf: { contains: termo, mode: 'insensitive' } }
    ];
    if (!isNaN(termo)) filtros.push({ id: parseInt(termo) });

    const resultados = await prisma.user.findMany({
      where: { OR: filtros },
      include: { CarteiraDK: true, RewardsDK: true }
    });

    res.json(resultados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro na busca' });
  }
};

// ✅ Exportar usuários CSV
exports.exportarUsuariosCSV = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { CarteiraDK: true, RewardsDK: true }
    });

    const data = users.map(u => ({
      id: u.id,
      nome: u.name,
      email: u.email,
      cpf: u.cpf,
      phone: u.phone,
      saldoDK: u.CarteiraDK?.saldo ?? 0,
      pontos: u.RewardsDK?.pontos ?? 0,
      criadoEm: u.createdAt
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('usuarios.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao exportar CSV' });
  }
};

// ✅ Listar suspeitas
exports.listarSuspeitas = async (req, res) => {
  const flags = await prisma.flagSuspeita.findMany({
    include: { user: true },
    orderBy: { data: 'desc' }
  });
  res.json(flags);
};

// ✅ Permissões - buscar permissões
exports.listarPermissoes = async (req, res) => {
  try {
    const permissoes = await prisma.adminPermissao.findMany({
      include: { admin: true }
    });
    res.json(permissoes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar permissões' });
  }
};

// ✅ Permissões - atualizar individualmente
exports.atualizarPermissao = async (req, res) => {
  const { adminId, recurso, podeLer, podeGravar } = req.body;
  try {
    const existente = await prisma.adminPermissao.findFirst({
      where: { adminId, recurso }
    });

    if (existente) {
      await prisma.adminPermissao.update({
        where: { id: existente.id },
        data: { podeLer, podeGravar }
      });
    } else {
      await prisma.adminPermissao.create({
        data: { adminId, recurso, podeLer, podeGravar }
      });
    }

    res.json({ message: 'Permissão atualizada com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar permissão' });
  }
};

// ✅ Permissões - buscar todas permissões
exports.getPermissoesAdmin = async (req, res) => {
  try {
    const permissoes = await prisma.adminPermissao.findMany({
      include: { admin: true },
      orderBy: { adminId: 'asc' }
    });
    res.json(permissoes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar permissões' });
  }
};

// ✅ Permissões - salvar várias de uma vez
exports.salvarPermissoes = async (req, res) => {
  const { adminId, permissoes } = req.body;
  try {
    await prisma.adminPermissao.deleteMany({ where: { adminId } });

    const novas = permissoes.map(p => ({
      adminId,
      recurso: p.recurso,
      podeLer: p.podeLer,
      podeGravar: p.podeGravar
    }));

    await prisma.adminPermissao.createMany({ data: novas });
    res.json({ message: 'Permissões salvas com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao salvar permissões' });
  }
};

// ✅ Configuração geral
exports.getConfiguracaoSistema = async (req, res) => {
  try {
    let config = await prisma.configuracaoSistema.findFirst();
    if (!config) config = await prisma.configuracaoSistema.create({ data: {} });
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar configuração' });
  }
};

exports.atualizarConfiguracaoSistema = async (req, res) => {
  const { cotacaoBase, limiteSaque, mensagemAviso } = req.body;
  try {
    let config = await prisma.configuracaoSistema.findFirst();
    if (!config) config = await prisma.configuracaoSistema.create({ data: {} });

    await prisma.configuracaoSistema.update({
      where: { id: config.id },
      data: { cotacaoBase, limiteSaque, mensagemAviso }
    });

    res.json({ message: 'Configuração atualizada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar configuração' });
  }
};

// ✅ Get Admin Logs
exports.getAdminLogs = async (req, res) => {
  try {
    const logs = await prisma.adminLog.findMany({
      include: {
        admin: { select: { nome: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    console.error('Erro ao buscar logs administrativos:', err);
    res.status(500).json({ message: 'Erro interno ao buscar logs' });
  }
};


