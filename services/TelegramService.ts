import { Phrase, Contact } from '../types';

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

const validateTelegramToken = (token: string): boolean => {
  // El token de Telegram debe tener el formato: números:letras
  const telegramTokenRegex = /^\d+:[A-Za-z0-9_-]{35}$/;
  return telegramTokenRegex.test(token);
};

export const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> => {
  if (!validateTelegramToken(botToken)) {
    throw new Error('Token de Telegram inválido. Debe ser un token válido de BotFather.');
  }

  if (!chatId) {
    throw new Error('ID de chat de Telegram inválido.');
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error de Telegram: ${errorData.description || response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error enviando mensaje a Telegram:', error);
    throw error;
  }
};

export const scheduleMessage = (
  phrase: Phrase,
  contact: Contact,
  botToken: string
): void => {
  if (!validateTelegramToken(botToken)) {
    console.error('Token de Telegram inválido');
    return;
  }

  const sendTime = new Date(phrase.sendDateTime).getTime();
  const now = Date.now();
  const delay = sendTime - now;

  if (delay < 0) {
    console.warn('La hora de envío ya ha pasado');
    return;
  }

  setTimeout(async () => {
    try {
      await sendTelegramMessage(botToken, contact.telegramId, phrase.text);
      console.log(`Mensaje enviado exitosamente a ${contact.name}`);
    } catch (error) {
      console.error(`Error al enviar mensaje a ${contact.name}:`, error);
    }
  }, delay);
}; 