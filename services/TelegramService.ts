import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage } from 'telegram/events';
import { Api } from 'telegram/tl';
import dotenv from 'dotenv';

dotenv.config();

class TelegramService {
  private static instance: TelegramService;
  private client: TelegramClient | null = null;
  private isConnected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionCheckTimer: NodeJS.Timeout | null = null;
  private keepAliveTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // Constructor privado para Singleton
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Telegram ya está conectado');
      return;
    }

    try {
      const apiId = parseInt(process.env.TELEGRAM_API_ID || '');
      const apiHash = process.env.TELEGRAM_API_HASH || '';
      const session = new StringSession(process.env.TELEGRAM_SESSION || '');

      if (!apiId || !apiHash) {
        throw new Error('No se encontraron las credenciales de Telegram en las variables de entorno');
      }

      this.client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 5,
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('Conexión exitosa a Telegram');

      // Configurar reconexión automática
      this.setupReconnection();
      this.setupConnectionCheck();
      this.setupKeepAlive();

    } catch (error) {
      const errorData = error as Error;
      console.error('Error al conectar a Telegram:', errorData.message);
      throw error;
    }
  }

  private setupReconnection(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
    }

    this.reconnectTimer = setInterval(async () => {
      if (!this.isConnected && this.client) {
        try {
          await this.client.connect();
          this.isConnected = true;
          console.log('Reconexión exitosa a Telegram');
        } catch (error) {
          console.error('Error en la reconexión a Telegram:', error);
        }
      }
    }, 30000); // Intentar reconectar cada 30 segundos
  }

  private setupConnectionCheck(): void {
    if (this.connectionCheckTimer) {
      clearInterval(this.connectionCheckTimer);
    }

    this.connectionCheckTimer = setInterval(async () => {
      if (this.client && this.isConnected) {
        try {
          await this.client.getMe();
        } catch (error) {
          console.error('Error en la verificación de conexión:', error);
          this.isConnected = false;
        }
      }
    }, 60000); // Verificar conexión cada minuto
  }

  private setupKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }

    this.keepAliveTimer = setInterval(async () => {
      if (this.client && this.isConnected) {
        try {
          await this.client.invoke(new Api.Ping({ pingId: BigInt(Date.now()) }));
        } catch (error) {
          console.error('Error en el keep-alive:', error);
        }
      }
    }, 30000);
  }

  public async sendMessage(chatId: string, message: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Cliente de Telegram no conectado');
    }

    try {
      await this.client.sendMessage(chatId, { message });
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
    }
    if (this.connectionCheckTimer) {
      clearInterval(this.connectionCheckTimer);
    }
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }

    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  public isConnectedToTelegram(): boolean {
    return this.isConnected;
  }
}

export const telegramService = TelegramService.getInstance(); 