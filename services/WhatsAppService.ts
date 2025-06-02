import { io, Socket } from 'socket.io-client';
import axios from 'axios';

const API_URL = 'http://localhost:3000';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;
const RECONNECT_DELAY_MAX = 5000;
const CONNECTION_TIMEOUT = 20000;
const KEEP_ALIVE_INTERVAL = 30000; // 30 segundos

export interface WhatsAppStatus {
  connected: boolean;
  qrCode?: string;
}

export interface WhatsAppMessage {
  to: string;
  message: string;
}

class WhatsAppService {
  private static instance: WhatsAppService;
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private isConnecting = false;
  private isInitialized = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionCheckTimer: NodeJS.Timeout | null = null;
  private keepAliveTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // Constructor privado para Singleton
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  public initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.initializeSocket();
  }

  private clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connectionCheckTimer) {
      clearInterval(this.connectionCheckTimer);
      this.connectionCheckTimer = null;
    }
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private startKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }

    this.keepAliveTimer = setInterval(async () => {
      try {
        if (this.socket?.connected) {
          const response = await axios.get(`${API_URL}/api/whatsapp/ping`);
          if (response.status === 200) {
            console.log('Keep-alive ping exitoso');
          }
        }
      } catch (error) {
        console.error('Error en keep-alive ping:', error);
        this.handleConnectionError(error);
      }
    }, KEEP_ALIVE_INTERVAL);
  }

  private initializeSocket() {
    if (this.isConnecting || this.socket?.connected) return;
    this.isConnecting = true;

    console.log('Iniciando conexión Socket.IO...');

    // Limpiar socket existente si hay uno
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }

    // Limpiar timers existentes
    this.clearTimers();

    try {
      this.socket = io(API_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_DELAY,
        reconnectionDelayMax: RECONNECT_DELAY_MAX,
        timeout: CONNECTION_TIMEOUT,
        autoConnect: true,
        forceNew: true,
        path: '/socket.io',
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('Error al inicializar Socket.IO:', error);
      this.handleConnectionError(error);
    }
  }

  private handleConnectionError(error: any) {
    this.isConnecting = false;
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Máximo número de intentos de reconexión alcanzado');
      this.notifyListeners('connection_error', {
        message: 'No se pudo establecer la conexión con el servidor',
        error: error.message
      });
    } else {
      const delay = Math.min(RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), RECONNECT_DELAY_MAX);
      console.log(`Reintentando conexión en ${delay}ms... (Intento ${this.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }
      
      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts = 0; // Resetear intentos antes de reconectar
        this.initializeSocket();
      }, delay);
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.IO conectado. ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.notifyListeners('connection_status', { connected: true });
      
      // Iniciar verificación periódica de conexión y keep-alive
      this.startConnectionCheck();
      this.startKeepAlive();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión Socket.IO:', error.message);
      this.handleConnectionError(error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO desconectado. Razón:', reason);
      this.isConnecting = false;
      this.notifyListeners('connection_status', { 
        connected: false,
        reason: reason
      });
      
      // Intentar reconectar en todos los casos de desconexión
      this.scheduleReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket.IO reconectado después de', attemptNumber, 'intentos');
      this.reconnectAttempts = 0; // Resetear intentos después de reconexión exitosa
      this.notifyListeners('connection_status', { 
        connected: true,
        attempt: attemptNumber
      });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Error al reconectar Socket.IO:', error.message);
      this.handleConnectionError(error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Falló la reconexión de Socket.IO después de', MAX_RECONNECT_ATTEMPTS, 'intentos');
      this.notifyListeners('connection_error', { 
        message: 'No se pudo reconectar con el servidor',
        attempts: MAX_RECONNECT_ATTEMPTS
      });
      // Intentar una última reconexión después de un tiempo más largo
      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.initializeSocket();
      }, RECONNECT_DELAY_MAX * 2);
    });

    this.socket.on('qr', (qrCode: string) => {
      this.notifyListeners('qr', qrCode);
    });

    this.socket.on('session_status', (status: boolean) => {
      this.notifyListeners('session_status', status);
    });

    this.socket.on('message_sent', (data: any) => {
      this.notifyListeners('message_sent', data);
    });

    this.socket.on('message_error', (error: any) => {
      this.notifyListeners('message_error', error);
    });
  }

  private startConnectionCheck() {
    if (this.connectionCheckTimer) {
      clearInterval(this.connectionCheckTimer);
    }

    this.connectionCheckTimer = setInterval(() => {
      if (!this.socket?.connected) {
        console.log('Conexión perdida detectada, intentando reconectar...');
        this.scheduleReconnect();
      }
    }, 5000); // Verificar cada 5 segundos
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      if (!this.socket?.connected) {
        console.log('Iniciando reconexión programada...');
        this.reconnectAttempts = 0; // Resetear intentos antes de reconectar
        this.initializeSocket();
      }
    }, RECONNECT_DELAY);
  }

  public addEventListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  public removeEventListener(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  public async getStatus(): Promise<WhatsAppStatus> {
    try {
      const response = await axios.get(`${API_URL}/api/whatsapp/status`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener el estado de WhatsApp:', error);
      throw error;
    }
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    // Eliminar todos los caracteres no numéricos excepto el +
    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    
    // Si el número comienza con +, mantenerlo
    const hasPlus = normalized.startsWith('+');
    if (hasPlus) {
      normalized = normalized.substring(1);
    }

    // Si el número comienza con 54, verificar si necesita el 9
    if (normalized.startsWith('54')) {
      // Si después del 54 viene un número de área (2-3 dígitos), agregar el 9
      if (normalized.length >= 3) {
        const areaCode = normalized.substring(2, 4);
        if (areaCode.length === 2 && !normalized.startsWith('549')) {
          normalized = '549' + normalized.substring(2);
        }
      }
    }
    // Si el número comienza con 15, asumimos que es un número argentino
    else if (normalized.startsWith('15')) {
      normalized = '549' + normalized.substring(2);
    }
    // Si el número comienza con 0, reemplazar por 54
    else if (normalized.startsWith('0')) {
      normalized = '54' + normalized.substring(1);
    }
    // Si el número no tiene código de país y tiene 10 dígitos, asumimos que es argentino
    else if (normalized.length === 10) {
      normalized = '54' + normalized;
    }
    // Si el número comienza con código de área (2-3 dígitos), agregar 549
    else if (normalized.length >= 8 && normalized.length <= 11) {
      const firstDigit = normalized.charAt(0);
      if (firstDigit === '2' || firstDigit === '3') {
        normalized = '549' + normalized;
      }
    }

    // Validar longitud final
    if (normalized.length < 10 || normalized.length > 15) {
      throw new Error(`El número de teléfono debe tener entre 10 y 15 dígitos después de la normalización. Longitud actual: ${normalized.length}`);
    }

    console.log('Número normalizado:', normalized);
    return normalized;
  }

  private validateMessage(message: WhatsAppMessage): string | null {
    if (!message.to) {
      return 'El número de teléfono es requerido';
    }
    if (!message.message) {
      return 'El mensaje es requerido';
    }
    if (message.message.length > 4096) {
      return 'El mensaje no puede tener más de 4096 caracteres';
    }

    try {
      // Normalizar el número de teléfono
      message.to = this.normalizePhoneNumber(message.to);
      return null;
    } catch (error: any) {
      return error.message;
    }
  }

  public async sendMessage(message: WhatsAppMessage): Promise<void> {
    try {
      const validationError = this.validateMessage(message);
      if (validationError) {
        throw new Error(validationError);
      }

      if (!this.socket?.connected) {
        throw new Error('No hay conexión con el servidor de WhatsApp');
      }

      const response = await axios.post(`${API_URL}/api/whatsapp/send`, {
        ...message,
        to: message.to // Ya está normalizado por validateMessage
      });

      if (response.status === 200) {
        // Emitir evento de mensaje enviado
        const event = new CustomEvent('message_sent', {
          detail: {
            message: message.message,
            to: message.to,
            timestamp: new Date(),
            contacts: [message.to] // En caso de envío masivo, aquí irían todos los contactos
          }
        });
        window.dispatchEvent(event);
      } else {
        throw new Error('Error al enviar el mensaje');
      }
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      this.notifyListeners('message_error', {
        message: error.message || 'Error al enviar el mensaje',
        details: error.response?.data || error
      });
      throw error;
    }
  }

  public disconnect() {
    this.clearTimers();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isInitialized = false;
    this.reconnectAttempts = 0;
  }

  public reconnect() {
    if (!this.isConnecting && !this.socket?.connected) {
      this.initializeSocket();
    }
  }
}

export const whatsAppService = WhatsAppService.getInstance(); 