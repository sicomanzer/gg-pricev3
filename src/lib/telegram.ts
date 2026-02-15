
import { toast } from "sonner";

export const sendTelegramMessage = async (message: string) => {
  const token = localStorage.getItem('telegram_bot_token');
  const chatId = localStorage.getItem('telegram_chat_id');

  if (!token || !chatId) {
    console.log('Telegram credentials not found');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
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

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API Error:', data);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
};
