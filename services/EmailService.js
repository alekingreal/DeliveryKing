// services/EmailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // ou outro provedor
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendRecoveryEmail = async (to, link) => {
  await transporter.sendMail({
    from: '"DeliveryKing" <no-reply@deliveryking.com.br>',
    to,
    subject: 'Recupere seu acesso - DeliveryKing',
    html: `
      <p>Olá,</p>
      <p>Recebemos uma solicitação de acesso à sua conta. Clique no link abaixo para recuperar:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Este link expira em 15 minutos.</p>
    `,
  });
};

module.exports = { sendRecoveryEmail };
