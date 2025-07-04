// uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dirAvatar = path.join(__dirname, '..', 'uploads', 'avatars');
const dirVeiculo = path.join(__dirname, '..', 'uploads', 'veiculos');

// Cria as pastas se não existirem
[dirAvatar, dirVeiculo].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'avatar') return cb(null, dirAvatar);
    if (file.fieldname === 'fotoVeiculo') return cb(null, dirVeiculo);
    cb(null, dirAvatar); // fallback
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${file.fieldname}_${Date.now()}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage });
module.exports = upload;
