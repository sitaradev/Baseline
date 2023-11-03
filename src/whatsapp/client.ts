import WhatsAppClient from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

import { commands } from './commands';

if (!process.env.PHONE_NUMBER) {
  process.exit(1);
}

const client = new WhatsAppClient.Client({
  authStrategy: new WhatsAppClient.LocalAuth(),
});

client.on('qr', (qr: string) => {
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => console.log(`Bot has been authenticated.`));

client.on('ready', () => {
  console.log('Bot is ready to communicate.');
});

client.on('message_create', (message: WhatsAppClient.Message) => commands(message, client));

client.initialize();

module.exports = client;
