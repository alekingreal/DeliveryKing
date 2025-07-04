module.exports = function paramsTypeCast(req, res, next) {
    // Percorre todos os parâmetros de rota (req.params)
    for (const param in req.params) {
      if (req.params.hasOwnProperty(param)) {
        // Se o parâmetro parece ser ID (id, userId, partnerId, etc)
        if (/id$/i.test(param)) {
          const originalValue = req.params[param];
          const parsedValue = parseInt(originalValue);
          if (!isNaN(parsedValue)) {
            req.params[param] = parsedValue;
          }
        }
      }
    }
    next();
  };
  