import React, { useState, useEffect } from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  nextScheduledTime?: Date;
}

interface MessageStatus {
  totalSent: number;
  totalContacts: number;
  lastSentTime?: Date;
}

const menu = [
  { label: 'Dashboard', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0 0H7m6 0h6" /></svg>
  ), view: AppView.Dashboard },
  { label: 'Frases', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2m10 0V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2m10 0H7" /></svg>
  ), view: AppView.Dashboard },
  { label: 'Contactos', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m9-4.13a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm6 8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2Z" /></svg>
  ), view: AppView.ManageContacts },
  { label: 'Simular Envío', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h2l.4 2M7 16h10l1.4-4H6.6M7 16l-1.4 4M17 16l1.4 4M6.6 16L5.2 20M17.4 16l1.4 4M9 20h6" /></svg>
  ), view: AppView.SimulateSend },
  { label: 'Pagos', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3Zm0 0V4m0 7v7m8-7a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
  ), view: AppView.Payments },
  { label: 'Ajustes', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.01c1.527-.878 3.276.87 2.398 2.398a1.724 1.724 0 0 0 1.01 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.01 2.573c.878 1.527-.87 3.276-2.398 2.398a1.724 1.724 0 0 0-2.573 1.01c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.01c-1.527.878-3.276-.87-2.398-2.398a1.724 1.724 0 0 0-1.01-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.01-2.572c-.878-1.527.87-3.276 2.398-2.398a1.724 1.724 0 0 0 2.573-1.01z" /></svg>
  ), view: AppView.Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, nextScheduledTime }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isMessageStatusOpen, setIsMessageStatusOpen] = useState<boolean>(false);
  const [messageStatus, setMessageStatus] = useState<MessageStatus>({
    totalSent: 0,
    totalContacts: 0
  });

  useEffect(() => {
    if (!nextScheduledTime) return;

    const updateProgress = () => {
      const now = new Date();
      const total = nextScheduledTime.getTime() - now.getTime();
      const remaining = Math.max(0, total);
      
      setTimeRemaining(remaining);
      
      // Calcular el progreso (0-100)
      const totalDuration = 5 * 60 * 1000; // 5 minutos en milisegundos
      const currentProgress = Math.min(100, Math.max(0, ((totalDuration - remaining) / totalDuration) * 100));
      setProgress(currentProgress);
    };

    // Actualizar inmediatamente
    updateProgress();

    // Actualizar cada segundo
    const interval = setInterval(updateProgress, 1000);

    return () => clearInterval(interval);
  }, [nextScheduledTime]);

  // Escuchar eventos de mensajes enviados
  useEffect(() => {
    const handleMessageSent = (data: any) => {
      setMessageStatus(prev => ({
        totalSent: prev.totalSent + 1,
        totalContacts: data.contacts?.length || prev.totalContacts,
        lastSentTime: new Date()
      }));
    };

    // Suscribirse al evento de mensajes enviados
    window.addEventListener('message_sent', handleMessageSent);

    return () => {
      window.removeEventListener('message_sent', handleMessageSent);
    };
  }, []);

  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return 'Enviando...';
    
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatLastSentTime = (date?: Date): string => {
    if (!date) return 'Nunca';
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col justify-between py-8 px-4 font-sans shadow z-20" style={{ fontFamily: 'Inter, DM Sans, sans-serif' }}>
      <div>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-blue-700">AI</div>
          <div>
            <div className="text-lg font-bold text-gray-900">CoachAI</div>
            <div className="text-xs text-gray-400">Tu asistente de coaching</div>
          </div>
        </div>

        {/* Estado de mensajes enviados */}
        <div className="mb-6 px-4">
          <button
            onClick={() => setIsMessageStatusOpen(!isMessageStatusOpen)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Mensajes Enviados</span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${isMessageStatusOpen ? 'transform rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isMessageStatusOpen && (
            <div className="mt-2 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Enviados:</span>
                  <span className="text-sm font-medium text-gray-900">{messageStatus.totalSent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Contactos:</span>
                  <span className="text-sm font-medium text-gray-900">{messageStatus.totalContacts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Último envío:</span>
                  <span className="text-sm font-medium text-gray-900">{formatLastSentTime(messageStatus.lastSentTime)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra de progreso para el próximo envío */}
        {nextScheduledTime && (
          <div className="mb-6 px-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Próximo envío</span>
              <span className="text-sm text-gray-500">{formatTimeRemaining(timeRemaining)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-1">
          {menu.map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.view)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-150 mb-1 ${
                currentView === item.view ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={{ fontFamily: 'Inter, DM Sans, sans-serif' }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium text-gray-500 hover:bg-gray-50 transition-all duration-150"
        style={{ fontFamily: 'Inter, DM Sans, sans-serif' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" /></svg>
        Cerrar Sesión
      </button>
    </aside>
  );
};

export default Sidebar; 