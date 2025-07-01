// backend/services/VerificationQueue.js

const queue = new Map();

function setCode(phone, code, ttlMs = 5 * 60 * 1000) {
  // Limpa qualquer código anterior
  clearTimeout(queue.get(phone)?.timeout);

  const timeout = setTimeout(() => {
    queue.delete(phone);
    console.log(`⌛ Código expirado para ${phone}`);
  }, ttlMs);

  queue.set(phone, { code, timeout });
}

function getCode(phone) {
  const entry = queue.get(phone);
  return entry ? entry.code : null;
}

function deleteCode(phone) {
  if (queue.has(phone)) {
    clearTimeout(queue.get(phone).timeout);
    queue.delete(phone);
  }
}

module.exports = {
  setCode,
  getCode,
  deleteCode
};
