// backend/services/WhatsAppService.js
const wppconnect = require('@wppconnect-team/wppconnect');
const { setCode, getCode } = require('./VerificationQueue');

const browserPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

let client = null;

const inicializarCliente = async () => {
  try {
    client = await wppconnect.create({
      session: 'deliveryking',
      folderNameToken: 'tokens',
      headless: false, // queremos ver o navegador abrindo!
      browserExecutablePath: browserPath,
      useChrome: true,
      catchQR: (base64Qrimg, asciiQR) => {
        console.log('⚠️ Escaneie esse QR code com seu WhatsApp:');
        console.log(asciiQR);
      },
      statusFind: (statusSession, session) => {
        console.log(`🟢 Status da sessão ${session}: ${statusSession}`);
      },
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=TrustedTypes'
      ]
    });
    
    console.log('✅ Cliente WhatsApp inicializado com sucesso!');

    // 🚨 Força abertura de uma conversa real com uma mensagem qualquer
    const msgFake = `🤖 Inicialização do bot concluída com sucesso`;
    await client.sendText('5579998192216@c.us', msgFake); // pode ser qualquer contato real ou seu número

    // Espera 2 segundos para garantir que a conversa foi aberta corretamente
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Agora sim registramos os listeners
    client.onMessage(async (message) => {
      const conteudo = message.body.trim().toLowerCase();

      if (conteudo === 'quero o código') {
        const phone = message.from.replace('@c.us', '');
        const code = await getCode(phone);

        if (!code) {
          await client.sendText(message.from, '❌ O código expirou ou não foi encontrado. Solicite novamente.');
          return;
        }

        await client.sendText(message.from, `🔐 Seu código é: *${code}*`);
        console.log(`✅ Código enviado para ${phone} após resposta de texto`);
      }
    });

  } catch (err) {
    console.error('❌ Erro ao inicializar cliente WhatsApp:', err);
  }
};



const sendCodeViaWhatsApp = async (phone, code) => {
  if (!client) {
    console.warn('⚠️ Cliente WhatsApp ainda não está pronto!');
    return;
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    const whatsappId = `${fullPhone}@c.us`;
    const formattedPhone = `+${fullPhone}`;

    await setCode(fullPhone, code); // salvar o código

    const mensagem = `❓ Você solicitou um código de verificação para o DeliveryKing?\n\n*Responda com:* _Quero o código_ para receber.`;

    await client.sendText(whatsappId, mensagem);
    console.log(`📨 Pergunta enviada para ${formattedPhone}`);
  } catch (err) {
    console.error('❌ Erro ao enviar mensagem com pergunta simulada:', err);
  }
};




module.exports = {
  inicializarCliente,
  sendCodeViaWhatsApp,
};
