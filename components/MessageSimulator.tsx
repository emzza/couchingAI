import React, { useState, useMemo, useEffect } from 'react';
import { Phrase, Contact, AppView, Platform } from '../types';
import { scheduleMessage } from '../services/TelegramService';
import { whatsAppService } from '../services/WhatsAppService';
import ReturnPanelButton from './ui/ReturnPanelButton';

interface MessageSimulatorProps {
  phrases: Phrase[];
  contacts: Contact[];
  onNavigate: (view: AppView) => void;
  telegramBotToken: string | null;
}

interface SimulatedMessage {
  contactName: string;
  contactId: string;
  phraseText: string;
  sendTime: string;
  status: 'pending' | 'scheduled' | 'error';
  platform: Platform;
}

const MessageSimulator: React.FC<MessageSimulatorProps> = ({ 
  phrases, 
  contacts, 
  onNavigate,
  telegramBotToken 
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [scheduledMessages, setScheduledMessages] = useState<SimulatedMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('telegram');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const telegramContacts = contacts.filter(c => c.platform === 'telegram');
  const whatsappContacts = contacts.filter(c => c.platform === 'whatsapp');

  const activePhrases = useMemo(() => {
    const now = new Date();
    return phrases.filter(phrase => {
      try {
        const sendDate = new Date(phrase.sendDateTime);
        return sendDate > now; 
      } catch (e) {
        return false; 
      }
    });
  }, [phrases]);

  const simulatedMessages: SimulatedMessage[] = useMemo(() => {
    if (!showPreview || contacts.length === 0 || activePhrases.length === 0) {
      return [];
    }
    const messages: SimulatedMessage[] = [];
    const platformContacts = selectedPlatform === 'telegram' ? telegramContacts : whatsappContacts;
    
    activePhrases.forEach(phrase => {
      platformContacts.forEach(contact => {
        messages.push({
          contactName: contact.name,
          contactId: selectedPlatform === 'telegram' ? contact.telegramId! : contact.whatsappNumber!,
          phraseText: phrase.text,
          sendTime: new Date(phrase.sendDateTime).toLocaleString('es-ES', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
          }),
          status: 'pending',
          platform: selectedPlatform
        });
      });
    });
    return messages;
  }, [activePhrases, contacts, showPreview, selectedPlatform, telegramContacts, whatsappContacts]);

  const handleSimulate = () => {
    setShowPreview(true);
    setScheduledMessages([]);
    setError(null);
  };

  const handleScheduleMessages = () => {
    if (selectedPlatform === 'telegram' && !telegramBotToken) {
      setError('No hay un token de Telegram configurado. Por favor, configura el token en la sección de Configuración.');
      return;
    }

    const newScheduledMessages = simulatedMessages.map(msg => ({
      ...msg,
      status: 'scheduled' as const
    }));

    setScheduledMessages(newScheduledMessages);

    // Programar cada mensaje para su hora específica
    activePhrases.forEach(phrase => {
      const platformContacts = selectedPlatform === 'telegram' ? telegramContacts : whatsappContacts;
      const sendDateTime = new Date(phrase.sendDateTime);
      
      platformContacts.forEach(contact => {
        const timeUntilSend = sendDateTime.getTime() - Date.now();
        
        if (timeUntilSend > 0) {
          setTimeout(() => {
            if (selectedPlatform === 'telegram') {
              scheduleMessage(phrase, contact, telegramBotToken!);
            } else {
              // Programar mensaje de WhatsApp
              whatsAppService.sendMessage({
                to: contact.whatsappNumber!,
                message: phrase.text
              }).catch(error => {
                console.error('Error al enviar mensaje programado:', error);
                setError(`Error al enviar mensaje a ${contact.name}: ${error.message}`);
              });
            }
          }, timeUntilSend);
        }
      });
    });

    setNotification({ 
      type: 'success', 
      message: `Se han programado ${newScheduledMessages.length} mensajes para envío.` 
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedPlatform === 'telegram') {
        if (!telegramBotToken) {
          setNotification({ type: 'error', message: 'No hay un token de Telegram configurado' });
          return;
        }
        // Implementar envío de mensaje por Telegram
      } else {
        await whatsAppService.sendMessage({
          to: phoneNumber,
          message: message
        });
      }
      setNotification({ type: 'success', message: 'Mensaje enviado correctamente' });
      setPhoneNumber('');
      setMessage('');
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al enviar el mensaje' });
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return 'Fecha Inválida';
    }
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto w-full py-8">
      <ReturnPanelButton onClick={() => onNavigate(AppView.Dashboard)} />
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Simular Envío de Mensajes</h2>

      {/* Selector de Plataforma */}
      <div className="bg-white p-8 rounded-2xl shadow-lg mb-10 w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-primary-600">Seleccionar Plataforma</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="telegram"
                name="platform"
                value="telegram"
                checked={selectedPlatform === 'telegram'}
                onChange={() => setSelectedPlatform('telegram')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="telegram" className="ml-2 text-gray-700">
                Telegram ({telegramContacts.length})
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="whatsapp"
                name="platform"
                value="whatsapp"
                checked={selectedPlatform === 'whatsapp'}
                onChange={() => setSelectedPlatform('whatsapp')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="whatsapp" className="ml-2 text-gray-700">
                WhatsApp ({whatsappContacts.length})
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de Envío Directo */}
      <div className="bg-white p-8 rounded-2xl shadow-lg mb-10 w-full">
        <h3 className="text-xl font-semibold text-primary-600 mb-4">Enviar Mensaje Directo</h3>
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
              {selectedPlatform === 'telegram' ? 'ID de Telegram' : 'Número de WhatsApp'}
            </label>
            <input
              id="recipient"
              type={selectedPlatform === 'telegram' ? 'text' : 'tel'}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={selectedPlatform === 'telegram' ? 'Ej: @usuario' : 'Ej: 1234567890'}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
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
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              placeholder="Escribe tu mensaje aquí..."
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition duration-150"
          >
            Enviar Mensaje
          </button>
        </form>
      </div>

      {/* Simulación de Mensajes Programados */}
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full mb-10">
        <p className="text-gray-700 mb-2">
          Esto mostrará una vista previa de qué mensajes se enviarían a quién, basándose en frases activas (programadas para el futuro) y contactos disponibles.
        </p>
        <p className="text-gray-600 text-sm mb-4">
          Actualmente, hay <strong>{activePhrases.length}</strong> frase(s) activa(s) y <strong>{selectedPlatform === 'telegram' ? telegramContacts.length : whatsappContacts.length}</strong> contacto(s) de {selectedPlatform}.
        </p>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {selectedPlatform === 'telegram' && !telegramBotToken && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded" role="alert">
            <p className="font-bold">Aviso</p>
            <p>No hay un token de Telegram configurado. Los mensajes no se enviarán hasta que configures el token en la sección de Configuración.</p>
          </div>
        )}
        
        {((selectedPlatform === 'telegram' && telegramContacts.length === 0) || 
          (selectedPlatform === 'whatsapp' && whatsappContacts.length === 0) || 
          activePhrases.length === 0) && !showPreview && (
            <p className="text-orange-600 bg-orange-100 border-l-4 border-orange-500 p-3 rounded-md">
                Por favor, añade algunos contactos y frases programadas para el futuro para simular el envío.
            </p>
        )}

        <div className="space-y-4">
          <button
            onClick={handleSimulate}
            disabled={(selectedPlatform === 'telegram' && telegramContacts.length === 0) || 
                     (selectedPlatform === 'whatsapp' && whatsappContacts.length === 0) || 
                     activePhrases.length === 0}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showPreview ? 'Re-Simular Mensajes' : 'Simular Envío de Mensajes Ahora'}
          </button>

          {showPreview && simulatedMessages.length > 0 && (
            <button
              onClick={handleScheduleMessages}
              disabled={selectedPlatform === 'telegram' && !telegramBotToken}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Programar Envío de Mensajes
            </button>
          )}
        </div>

        {showPreview && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-primary-600 mb-4">
              Vista Previa de Mensajes {scheduledMessages.length > 0 ? 'Programados' : 'Simulados'} ({simulatedMessages.length} mensajes totales)
            </h3>
            {simulatedMessages.length === 0 ? (
              <p className="text-gray-500">No hay mensajes para simular. Asegúrate de tener frases activas y contactos.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto p-1">
                {simulatedMessages.map((msg, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                    <p className="font-semibold text-primary-700">
                      Para: {msg.contactName} ({msg.contactId})
                    </p>
                    <p className="text-gray-700 my-1">"{msg.phraseText}"</p>
                    <p className="text-sm text-gray-500">Hora de Envío Programada: {msg.sendTime}</p>
                    <p className="text-sm text-gray-500">Plataforma: {msg.platform === 'telegram' ? 'Telegram' : 'WhatsApp'}</p>
                    {scheduledMessages.length > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline mr-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        Mensaje programado para envío
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notificaciones */}
      {notification && (
        <div className={`mt-4 p-4 rounded-md ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default MessageSimulator;