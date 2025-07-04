const verificarComprovanteVencido = (user) => {
    const ultimaAtualizacao = user.enderecoAtualizadoEm;
    if (!ultimaAtualizacao) return true;
  
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
  
    return ultimaAtualizacao < seisMesesAtras;
  };
  
  module.exports = { verificarComprovanteVencido };
  