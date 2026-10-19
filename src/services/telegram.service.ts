import TelegramBot from 'node-telegram-bot-api';

export class TelegramService {
  private static bot: TelegramBot | null = null;
  private static chatId: string | null = null;

  private static initialize() {
    if (this.bot !== null) return;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (token && chatId) {
      // Use polling: false because we only want to send messages
      this.bot = new TelegramBot(token, { polling: false });
      this.chatId = chatId;
      console.log('[TelegramService] Initialized successfully.');
    } else {
      console.warn('[TelegramService] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured in .env. Notifications are disabled.');
    }
  }

  static async sendMessage(message: string): Promise<boolean> {
    try {
      this.initialize();

      if (!this.bot || !this.chatId) {
        return false;
      }

      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
      });
      return true;
    } catch (error) {
      console.error('[TelegramService] Failed to send message:', error);
      return false;
    }
  }
}
