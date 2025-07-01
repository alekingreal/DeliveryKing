// backend/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cria a pasta se não existir
const dir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `avatar_${Date.now()}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage });

module.exports = upload;
