import { io, Socket } from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_WSP_ONLINE ?? import.meta.env.VITE_API_WSP_LOCAL;

// Función para normalizar URLs
const normalizeUrl = (url: string): string => {
  // Eliminar barras al final de la URL base
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  return baseUrl;
};

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;
const RECONNECT_DELAY_MAX = 5000;
const CONNECTION_TIMEOUT = 20000;
const KEEP_ALIVE_INTERVAL = 30000; // 30 segundos
const CONFIRMATION_TIMEOUT = 10000; // 10 segundos

export interface WhatsAppStatus {
  connected: boolean;
  qrCode?: string;
  status: 'not_initialized' | 'connecting' | 'connected' | 'fully_connected' | 'disconnected' | 'auth_failure' | 'authenticated';
  requiresConfirmation?: boolean;
  message?: string;
  clientInfo?: {
    state?: string;
    info?: any;
  };
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
  private isFullyConnected = false;
  private isWaitingConfirmation = false;
  private confirmationTimeout: NodeJS.Timeout | null = null;
  private lastQR: string | null = null;

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
    if (this.isInitialized) {
      console.log('WhatsAppService ya está inicializado');
      return;
    }
    
    console.log('Inicializando WhatsAppService...');
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
    if (this.confirmationTimeout) {
      clearTimeout(this.confirmationTimeout);
      this.confirmationTimeout = null;
    }
  }

  private startKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }

    this.keepAliveTimer = setInterval(async () => {
      try {
        if (this.socket?.connected) {
          const response = await axios.get(`${normalizeUrl(API_URL)}/api/whatsapp/ping`, {
            withCredentials: true,
            headers: {
              'Access-Control-Allow-Origin': '*'
            }
          });
          if (response.status === 200) {
            console.log('Keep-alive ping exitoso');
          }
        }
      } catch (error) {
        console.error('Error en keep-alive ping:', error);
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
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_DELAY,
        reconnectionDelayMax: RECONNECT_DELAY_MAX,
        timeout: CONNECTION_TIMEOUT,
        autoConnect: true,
        forceNew: true,
        path: '/socket.io',
        withCredentials: true,
        extraHeaders: {
          'Access-Control-Allow-Origin': '*'
        }
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
      const currentUrl = API_URL;
      const alternativeUrl = currentUrl === import.meta.env.VITE_API_WSP_ONLINE 
        ? import.meta.env.VITE_API_WSP_LOCAL 
        : import.meta.env.VITE_API_WSP_ONLINE;
      
      console.log('Intentando con URL alternativa:', alternativeUrl);
      this.reconnectAttempts = 0;
      
      try {
        if (this.socket) {
          this.socket.removeAllListeners();
          this.socket.close();
          this.socket = null;
        }
        
        this.socket = io(alternativeUrl, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
          reconnectionDelay: RECONNECT_DELAY,
          reconnectionDelayMax: RECONNECT_DELAY_MAX,
          timeout: CONNECTION_TIMEOUT,
          autoConnect: true,
          forceNew: true,
          path: '/socket.io',
          withCredentials: true,
          extraHeaders: {
            'Access-Control-Allow-Origin': '*'
          }
        });
        
        this.setupSocketListeners();
      } catch (altError: any) {
        console.error('Error al conectar con URL alternativa:', altError);
        this.notifyListeners('connection_error', {
          message: 'No se pudo establecer la conexión con ninguna URL',
          error: altError.message
        });
      }
    } else {
      const delay = Math.min(RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), RECONNECT_DELAY_MAX);
      console.log(`Reintentando conexión en ${delay}ms... (Intento ${this.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }
      
      this.reconnectTimer = setTimeout(() => {
        this.initializeSocket();
      }, delay);
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // Limpiar listeners existentes para evitar duplicados
    this.socket.removeAllListeners();

    this.socket.on('connect', () => {
      console.log('Socket.IO conectado. ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      
      // Verificar el estado real de la sesión
      this.checkSession().then(isConnected => {
        if (!isConnected) {
          console.log('Sesión no activa, solicitando QR...');
          this.socket?.emit('request_qr');
        }
      });
      
      this.startConnectionCheck();
      this.startKeepAlive();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión Socket.IO:', error.message);
      this.handleConnectionError(error);
      this.notifyListeners('connection_status', { 
        connected: false,
        status: 'disconnected',
        error: error.message
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO desconectado. Razón:', reason);
      this.isConnecting = false;
      this.isFullyConnected = false;
      this.notifyListeners('connection_status', { 
        connected: false,
        status: 'disconnected',
        reason: reason
      });
      
      this.scheduleReconnect();
    });

    this.socket.on('session_status', (data: WhatsAppStatus) => {
      console.log('Estado de sesión recibido:', data);
      
      // Manejar la confirmación de conexión
      if (data.requiresConfirmation && !this.isWaitingConfirmation) {
        console.log('Confirmando conexión con el backend...');
        this.isWaitingConfirmation = true;
        this.socket?.emit('connection_confirmed');
        
        // Configurar timeout para la confirmación
        if (this.confirmationTimeout) {
          clearTimeout(this.confirmationTimeout);
        }
        
        this.confirmationTimeout = setTimeout(() => {
          if (this.isWaitingConfirmation) {
            console.log('Timeout de confirmación alcanzado');
            this.isWaitingConfirmation = false;
            if (!this.isFullyConnected) {
              console.log('Reintentando conexión...');
              this.socket?.emit('request_qr');
            }
          }
        }, CONFIRMATION_TIMEOUT);
      }

      // Actualizar estado según el status recibido
      switch (data.status) {
        case 'connected':
          // El estado connected ahora solo indica que la conexión inicial está establecida
          break;

        case 'fully_connected':
          this.isWaitingConfirmation = false;
          this.isFullyConnected = true;
          this.lastQR = null;
          if (this.confirmationTimeout) {
            clearTimeout(this.confirmationTimeout);
            this.confirmationTimeout = null;
          }
          break;

        case 'disconnected':
        case 'auth_failure':
          this.isWaitingConfirmation = false;
          this.isFullyConnected = false;
          this.lastQR = null;
          if (this.confirmationTimeout) {
            clearTimeout(this.confirmationTimeout);
            this.confirmationTimeout = null;
          }
          break;
      }

      // Notificar a los listeners del cambio de estado
      this.notifyListeners('session_status', data);
      this.notifyListeners('connection_status', { 
        connected: data.status === 'fully_connected',
        status: data.status,
        message: data.message,
        clientInfo: data.clientInfo
      });
    });

    this.socket.on('qr', (qrDataUrl: string) => {
      console.log('QR recibido');
      this.lastQR = qrDataUrl;
      this.notifyListeners('qr', qrDataUrl);
      this.notifyListeners('connection_status', { 
        connected: false,
        status: 'qr',
        qrCode: qrDataUrl
      });
    });

    this.socket.on('loading_status', (data: { percent: number, message: string }) => {
      console.log('Estado de carga:', data);
      if (data.percent === 100 && data.message === 'WhatsApp') {
        // Si la carga está completa, verificar el estado de la sesión
        this.checkSession().then(isConnected => {
          if (!isConnected && !this.lastQR) {
            console.log('Carga completa pero sin sesión, solicitando QR...');
            this.socket?.emit('request_qr');
          }
        });
      }
      this.notifyListeners('loading_status', data);
    });

    this.socket.on('error', (error: any) => {
      console.error('Error del socket:', error);
      this.notifyListeners('connection_error', {
        message: error.message || 'Error de conexión',
        status: 'disconnected'
      });
    });

    this.socket.on('message_sent', (data: any) => {
      console.log('Mensaje enviado:', data);
      this.notifyListeners('message_sent', data);
    });

    this.socket.on('message_error', (error: any) => {
      console.error('Error al enviar mensaje:', error);
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
    }, 5000);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      if (!this.socket?.connected) {
        console.log('Iniciando reconexión programada...');
        this.reconnectAttempts = 0;
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
    if (!this.socket?.connected) {
      throw new Error('No hay conexión con el servidor de WhatsApp');
    }

    if (!this.isFullyConnected) {
      console.log('Estado actual:', {
        isFullyConnected: this.isFullyConnected,
        socketConnected: this.socket.connected,
        status: this.socket.connected ? 'connected' : 'disconnected'
      });
      throw new Error('La conexión no está completamente establecida. Por favor, espera a que la conexión esté lista.');
    }

    try {
      const validationError = this.validateMessage(message);
      if (validationError) {
        throw new Error(validationError);
      }

      const response = await axios.post(`${normalizeUrl(API_URL)}/api/whatsapp/send`, {
        ...message,
        to: message.to
      });

      if (response.status === 200) {
        const event = new CustomEvent('message_sent', {
          detail: {
            message: message.message,
            to: message.to,
            timestamp: new Date(),
            contacts: [message.to]
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
    console.log('Desconectando WhatsAppService...');
    this.clearTimers();
    this.isWaitingConfirmation = false;
    this.isFullyConnected = false;
    this.isInitialized = false;
    this.lastQR = null;
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.reconnectAttempts = 0;
  }

  public reconnect() {
    if (!this.isConnecting && !this.socket?.connected) {
      this.initializeSocket();
    }
  }

  public async forceDisconnect(): Promise<void> {
    try {
      this.disconnect();
      
      const response = await axios.post(`${normalizeUrl(API_URL)}/api/whatsapp/logout`, {}, {
        withCredentials: true,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });

      if (response.status === 200) {
        console.log('Sesión de WhatsApp forzadamente desconectada');
        this.notifyListeners('connection_status', { 
          connected: false,
          status: 'disconnected',
          reason: 'forced_disconnect'
        });
        
        this.initializeSocket();
      }
    } catch (error) {
      console.error('Error al forzar la desconexión:', error);
      throw error;
    }
  }

  public async checkSession(): Promise<boolean> {
    try {
      const response = await axios.get(`${normalizeUrl(API_URL)}/api/whatsapp/status`, {
        withCredentials: true,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
      
      if (!response.data.connected) {
        this.initializeSocket();
      }
      
      return response.data.connected;
    } catch (error) {
      console.error('Error al verificar sesión:', error);
      this.initializeSocket();
      return false;
    }
  }

  public getLastQR(): string | null {
    return this.lastQR;
  }
}

export const whatsAppService = WhatsAppService.getInstance(); 