import React, { useState, useEffect } from 'react';
import { AppView } from '../types';
import ReturnPanelButton from './ui/ReturnPanelButton';
import { whatsAppService, WhatsAppMessage } from '../services/WhatsAppService';

interface SettingsViewProps {
  currentBotToken: string | null;
  onSetBotToken: (token: string) => void;
  onNavigate: (view: AppView) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentBotToken, onSetBotToken, onNavigate }) => {
  const [botTokenInput, setBotTokenInput] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{ percent: number, message: string } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'not_initialized' | 'connecting' | 'connected' | 'fully_connected' | 'disconnected' | 'auth_failure'>('not_initialized');

  useEffect(() => {
    whatsAppService.initialize();

    const handleQR = (qr: string) => {
      console.log('QR recibido en SettingsView');
      setQrCode(qr);
      setConnectionStatus('connecting');
    };

    const handleSessionStatus = (data: { status: string, connected: boolean }) => {
      console.log('Estado de sesión en SettingsView:', data);
      setConnectionStatus(data.status as any);
      setIsConnected(data.connected);
    };

    const handleMessageSent = () => {
      setNotification({ type: 'success', message: 'Mensaje enviado correctamente' });
      setPhoneNumber('');
      setMessage('');
    };

    const handleMessageError = (error: any) => {
      setNotification({ type: 'error', message: `Error al enviar mensaje: ${error.message}` });
    };

    const handleConnectionStatus = (status: { connected: boolean, status: string, reason?: string }) => {
      console.log('Estado de conexión:', status);
      setConnectionStatus(status.status as any);
      setIsConnected(status.connected);
      
      if (status.status === 'auth_failure') {
        setNotification({ 
          type: 'error', 
          message: 'Error de autenticación. Por favor, intenta conectar nuevamente.' 
        });
      } else if (status.reason) {
        setNotification({ 
          type: 'error', 
          message: `Conexión perdida: ${status.reason}` 
        });
      }
    };

    const handleLoadingStatus = (data: { percent: number, message: string }) => {
      console.log('Estado de carga:', data);
      setLoadingProgress(data);
    };

    // Agregar listeners
    whatsAppService.addEventListener('qr', handleQR);
    whatsAppService.addEventListener('session_status', handleSessionStatus);
    whatsAppService.addEventListener('message_sent', handleMessageSent);
    whatsAppService.addEventListener('message_error', handleMessageError);
    whatsAppService.addEventListener('connection_status', handleConnectionStatus);
    whatsAppService.addEventListener('loading_status', handleLoadingStatus);

    // Obtener estado inicial
    whatsAppService.getStatus().then(status => {
      console.log('Estado inicial:', status);
      setIsConnected(status.connected);
      if (!status.connected) {
        // Si no está conectado, forzar la generación del QR
        whatsAppService.reconnect();
      }
    }).catch(error => {
      console.error('Error al obtener estado inicial:', error);
      setNotification({ 
        type: 'error', 
        message: 'Error al conectar con el servidor de WhatsApp' 
      });
      // Intentar reconectar en caso de error
      whatsAppService.reconnect();
    });

    // Limpieza al desmontar
    return () => {
      whatsAppService.removeEventListener('qr', handleQR);
      whatsAppService.removeEventListener('session_status', handleSessionStatus);
      whatsAppService.removeEventListener('message_sent', handleMessageSent);
      whatsAppService.removeEventListener('message_error', handleMessageError);
      whatsAppService.removeEventListener('connection_status', handleConnectionStatus);
      whatsAppService.removeEventListener('loading_status', handleLoadingStatus);
    };
  }, []);

  const handleSubmitToken = (e: React.FormEvent) => {
    e.preventDefault();
    onSetBotToken(botTokenInput);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (connectionStatus !== 'fully_connected') {
        throw new Error('La conexión no está lista para enviar mensajes. Por favor, espera a que la conexión esté completamente establecida.');
      }

      const whatsAppMessage: WhatsAppMessage = {
        to: phoneNumber,
        message: message
      };
      await whatsAppService.sendMessage(whatsAppMessage);
      setNotification({ type: 'success', message: 'Mensaje enviado correctamente' });
      setPhoneNumber('');
      setMessage('');
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      setNotification({ 
        type: 'error', 
        message: error.message || 'Error al enviar el mensaje'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconnect = () => {
    console.log('Iniciando reconexión...');
    setQrCode(null); // Limpiar QR existente
    setIsConnected(false); // Asegurar que el estado refleje desconexión
    whatsAppService.reconnect();
  };

  const handleForceDisconnect = async () => {
    setIsLoading(true);
    try {
      await whatsAppService.forceDisconnect();
      setQrCode(null);
      setIsConnected(false);
      setNotification({ type: 'success', message: 'Conexión limpiada correctamente' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al limpiar la conexión' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'not_initialized':
        return 'Iniciando conexión...';
      case 'connecting':
        return 'Esperando escaneo del código QR';
      case 'connected':
        return 'Conectado, esperando confirmación...';
      case 'fully_connected':
        return 'Conectado y listo para enviar mensajes';
      case 'disconnected':
        return 'Desconectado';
      case 'auth_failure':
        return 'Error de autenticación';
      default:
        return 'Estado desconocido';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'fully_connected':
        return 'text-green-600';
      case 'connected':
        return 'text-yellow-600';
      case 'auth_failure':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto w-full py-8">
      <ReturnPanelButton onClick={() => onNavigate(AppView.Dashboard)} />
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Configuración de la Aplicación</h2>

      {/* Bloque moderno para WhatsApp */}
      <div className="bg-white p-8 rounded-2xl shadow-lg mb-10 w-full">
        <h3 className="text-xl font-semibold text-green-600 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 17.487A9 9 0 1 1 21 12c0 1.657-.403 3.22-1.138 4.587l.638 2.326a1 1 0 0 1-1.262 1.262l-2.326-.638z" /></svg>
          Conectar WhatsApp
        </h3>
        <p className="text-gray-600 mb-4">Escanea el siguiente código QR con la app de WhatsApp en tu teléfono para conectar tu cuenta y poder enviar mensajes desde la plataforma.</p>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex flex-col items-center justify-center min-w-[180px] min-h-[180px] bg-gray-50 rounded-lg border border-dashed border-gray-200 p-4 relative">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-40 w-40">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <span className="text-sm text-gray-500 mt-2">Cargando...</span>
              </div>
            ) : loadingProgress ? (
              <div className="flex flex-col items-center justify-center h-40 w-40">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="text-blue-500 font-semibold">{loadingProgress.percent}%</div>
                </div>
                <span className="text-sm text-blue-600 mt-2">{loadingProgress.message}</span>
              </div>
            ) : connectionStatus === 'fully_connected' ? (
              <div className="flex flex-col items-center justify-center h-40 w-40">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className={`text-sm ${getStatusColor()} mt-2`}>{getStatusMessage()}</span>
              </div>
            ) : connectionStatus === 'connected' ? (
              <div className="flex flex-col items-center justify-center h-40 w-40">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                </div>
                <span className={`text-sm ${getStatusColor()} mt-2`}>{getStatusMessage()}</span>
              </div>
            ) : qrCode ? (
              <div className="flex flex-col items-center">
                <img src={qrCode} alt="Código QR de WhatsApp" className="w-40 h-40 object-contain" />
                <p className={`text-sm ${getStatusColor()} mt-2`}>{getStatusMessage()}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 w-40 text-gray-400">
                <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 8h.01M16 8h.01M8 16h.01M16 16h.01" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span className={`text-sm ${getStatusColor()}`}>{getStatusMessage()}</span>
                <button 
                  onClick={handleReconnect}
                  className="mt-2 px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                >
                  Solicitar QR
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {isConnected ? 
                <span className="flex items-center gap-1 text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Conectado
                </span> 
                : 
                <span className="flex items-center gap-1 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  No conectado
                </span>
              }
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleReconnect}
                className="mt-2 px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold shadow hover:bg-green-200 transition-all w-max"
                disabled={isLoading}
              >
                {isConnected ? 'Reconectar WhatsApp' : 'Conectar WhatsApp'}
              </button>
              {isConnected && (
                <button 
                  onClick={handleForceDisconnect}
                  className="mt-2 px-4 py-2 rounded-lg bg-red-100 text-red-800 font-semibold shadow hover:bg-red-200 transition-all w-max"
                  disabled={isLoading}
                >
                  Limpiar Conexión
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Asegúrate de que tu teléfono tenga conexión a internet y la sesión de WhatsApp Web esté activa.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg mb-10 w-full">
        <h3 className="text-xl font-semibold text-primary-600 mb-1">Token del Bot de Telegram</h3>
        <p className="text-sm text-gray-600 mb-4">
          Este token es necesario para que la aplicación pueda enviar mensajes a través de tu bot de Telegram.
          Obtén tu token de <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">BotFather</a>.
        </p>
        <form onSubmit={handleSubmitToken} className="space-y-4">
          <div>
            <label htmlFor="telegramToken" className="block text-sm font-medium text-gray-700">
              Tu Token de Telegram
            </label>
            <input
              id="telegramToken"
              type="password"
              value={botTokenInput}
              onChange={(e) => setBotTokenInput(e.target.value)}
              placeholder="Pega tu token aquí"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              aria-label="Token del Bot de Telegram"
            />
          </div>
          {currentBotToken && (
            <p className="text-sm text-green-600 bg-green-50 p-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline mr-1 align-text-bottom">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Un token de Telegram está actualmente guardado. Puedes actualizarlo o borrar el contenido del campo y guardar para eliminarlo.
            </p>
          )}
           {!currentBotToken && (
            <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded-md">
                No hay ningún token de Telegram guardado actualmente.
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150"
          >
            {currentBotToken ? 'Actualizar Token' : 'Guardar Token'}
          </button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full">
         <h3 className="text-xl font-semibold text-primary-600 mb-1">Clave API de Gemini</h3>
         <p className="text-sm text-gray-600">
            La clave API para el servicio de IA de Gemini se configura a través de variables de entorno
            (<code>API_KEY</code>)
            y no se gestiona desde esta interfaz.
         </p>
         <p className="text-xs text-gray-500 mt-2">
            Consulta la documentación o el archivo <code>.env.example</code> (si existe en tu proyecto) para más detalles sobre cómo configurarla si la generación de frases con IA no funciona.
         </p>
      </div>

    </div>
  );
};

export default SettingsView;