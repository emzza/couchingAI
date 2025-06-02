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

  useEffect(() => {
    // Inicializar el servicio de WhatsApp
    whatsAppService.initialize();

    // Configurar listeners de Socket.IO
    const handleQR = (qr: string) => {
      console.log('QR recibido');
      setQrCode(qr);
    };

    const handleSessionStatus = (status: boolean) => {
      console.log('Estado de sesión:', status);
      setIsConnected(status);
    };

    const handleMessageSent = () => {
      setNotification({ type: 'success', message: 'Mensaje enviado correctamente' });
      setPhoneNumber('');
      setMessage('');
    };

    const handleMessageError = (error: any) => {
      setNotification({ type: 'error', message: `Error al enviar mensaje: ${error.message}` });
    };

    const handleConnectionStatus = (status: { connected: boolean, reason?: string }) => {
      console.log('Estado de conexión:', status);
      setIsConnected(status.connected);
      if (!status.connected && status.reason) {
        setNotification({ 
          type: 'error', 
          message: `Conexión perdida: ${status.reason}` 
        });
      }
    };

    // Agregar listeners
    whatsAppService.addEventListener('qr', handleQR);
    whatsAppService.addEventListener('session_status', handleSessionStatus);
    whatsAppService.addEventListener('message_sent', handleMessageSent);
    whatsAppService.addEventListener('message_error', handleMessageError);
    whatsAppService.addEventListener('connection_status', handleConnectionStatus);

    // Obtener estado inicial
    whatsAppService.getStatus().then(status => {
      setIsConnected(status.connected);
      if (status.qrCode) {
        setQrCode(status.qrCode);
      }
    }).catch(error => {
      console.error('Error al obtener estado inicial:', error);
      setNotification({ 
        type: 'error', 
        message: 'Error al conectar con el servidor de WhatsApp' 
      });
    });

    // Limpieza al desmontar
    return () => {
      whatsAppService.removeEventListener('qr', handleQR);
      whatsAppService.removeEventListener('session_status', handleSessionStatus);
      whatsAppService.removeEventListener('message_sent', handleMessageSent);
      whatsAppService.removeEventListener('message_error', handleMessageError);
      whatsAppService.removeEventListener('connection_status', handleConnectionStatus);
    };
  }, []);

  const handleSubmitToken = (e: React.FormEvent) => {
    e.preventDefault();
    onSetBotToken(botTokenInput);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const whatsAppMessage: WhatsAppMessage = {
        to: phoneNumber,
        message: message
      };
      await whatsAppService.sendMessage(whatsAppMessage);
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al enviar el mensaje' });
    }
  };

  const handleReconnect = () => {
    whatsAppService.reconnect();
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
          <div className="flex flex-col items-center justify-center min-w-[180px] min-h-[180px] bg-gray-50 rounded-lg border border-dashed border-gray-200 p-4">
            {qrCode ? (
              <img src={qrCode} alt="Código QR de WhatsApp" className="w-40 h-40 object-contain" />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 w-40 text-gray-400">
                <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M8 8h.01M16 8h.01M8 16h.01M16 16h.01" stroke="currentColor" strokeWidth="2" /></svg>
                <span className="text-sm">QR no disponible</span>
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
      <button
              onClick={handleReconnect}
              className="mt-2 px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold shadow hover:bg-green-200 transition-all w-max"
      >
              {isConnected ? 'Reconectar WhatsApp' : 'Conectar WhatsApp'}
      </button>
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

      {/* Sección de WhatsApp */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Conexión WhatsApp</h3>
        
        {/* Estado de conexión */}
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">Estado: </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {/* Código QR */}
        {qrCode && !isConnected && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Escanea el código QR con WhatsApp:</p>
            <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48 mx-auto" />
          </div>
        )}

        {/* Formulario de envío de mensajes */}
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Número de teléfono
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ej: 1234567890"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Mensaje
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
              placeholder="Escribe tu mensaje aquí..."
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={!isConnected}
          >
            Enviar Mensaje
          </button>
        </form>

        {/* Notificaciones */}
        {notification && (
          <div className={`mt-4 p-4 rounded-md ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {notification.message}
          </div>
        )}
      </div>

    </div>
  );
};

export default SettingsView;