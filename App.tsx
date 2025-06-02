import React, { useState, useEffect, useCallback } from 'react';
import { Coach, Phrase, Contact, AppView } from './types';
import CoachLogin from './components/CoachLogin';
import Dashboard from './components/Dashboard';
import PhraseManager from './components/PhraseManager';
import ContactManager from './components/ContactManager';
import MessageSimulator from './components/MessageSimulator';
import SettingsView from './components/SettingsView';
import Sidebar from './components/Sidebar';
import { generateSimilarPhrases } from './services/GeminiService';
import PaymentsView from './components/PaymentsView';

const App: React.FC = () => {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentView, setCurrentView] = useState<AppView>(AppView.CoachLogin);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [telegramBotToken, setTelegramBotToken] = useState<string | null>(null);
  const [nextScheduledTime, setNextScheduledTime] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const storedCoachName = localStorage.getItem('coachName');
    if (storedCoachName) {
      const storedCoach: Coach = {
        id: crypto.randomUUID(),
        name: storedCoachName,
        email: `${storedCoachName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        billingInfo: {
          totalContacts: 0,
          totalBilled: 0,
          lastBillingDate: null
        }
      };
      setCoach(storedCoach);
      setCurrentView(AppView.Dashboard);
    }

    const storedPhrases = localStorage.getItem('phrases');
    if (storedPhrases) {
      setPhrases(JSON.parse(storedPhrases));
    }

    const storedContacts = localStorage.getItem('contacts');
    if (storedContacts) {
      setContacts(JSON.parse(storedContacts));
    }
    
    const storedToken = localStorage.getItem('telegramBotToken');
    if (storedToken) {
      setTelegramBotToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (phrases.length > 0 || localStorage.getItem('phrases')) { 
        localStorage.setItem('phrases', JSON.stringify(phrases));
    }
  }, [phrases]);

  useEffect(() => {
    if (contacts.length > 0 || localStorage.getItem('contacts')) { 
        localStorage.setItem('contacts', JSON.stringify(contacts));
    }
  }, [contacts]);

  const handleLogin = useCallback((name: string) => {
    const newCoach: Coach = {
      id: crypto.randomUUID(),
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      billingInfo: {
        totalContacts: 0,
        totalBilled: 0,
        lastBillingDate: null
      }
    };
    setCoach(newCoach);
    setCurrentView(AppView.Dashboard);
  }, []);

  const handleLogout = useCallback(() => {
    setCoach(null);
    localStorage.removeItem('coachName');
    setCurrentView(AppView.CoachLogin);
  }, []);

  const addPhrase = useCallback((phrase: Omit<Phrase, 'id' | 'coachName' | 'createdAt'>) => {
    if (!coach) return;
    const newPhrase: Phrase = { 
      ...phrase, 
      id: Date.now().toString(), 
      coachName: coach.name, 
      createdAt: new Date().toISOString() 
    };
    setPhrases(prev => [newPhrase, ...prev]);
    setError(null);
  }, [coach]);

  const deletePhrase = useCallback((id: string) => {
    setPhrases(prev => prev.filter(p => p.id !== id));
  }, []);

  const addContact = useCallback((contact: Omit<Contact, 'id' | 'createdAt'>) => {
    const newContact: Contact = { ...contact, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setContacts(prev => [newContact, ...prev]);
    setError(null);
  }, []);
  
  const deleteContact = useCallback((id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleSetTelegramToken = useCallback((token: string) => {
    if (token.trim()) {
      setTelegramBotToken(token.trim());
      localStorage.setItem('telegramBotToken', token.trim());
      setError(null); 
      alert('Token de Telegram guardado exitosamente.'); 
    } else {
      localStorage.removeItem('telegramBotToken');
      setTelegramBotToken(null);
      alert('Token de Telegram eliminado.');
    }
  }, []);

  const handleGeneratePhrases = async (basePhrase: string): Promise<string[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const similarPhrases = await generateSimilarPhrases(basePhrase);
      setIsLoading(false);
      return similarPhrases;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falló la generación de frases. Verifica la clave API (API_KEY) y la conexión.');
      setIsLoading(false);
      return [];
    }
  };

  const handleUpdateCoachBilling = useCallback((coachId: string, billingInfo: Coach['billingInfo']) => {
    setCoach(prev => {
      if (!prev || prev.id !== coachId) return prev;
      return {
        ...prev,
        billingInfo
      };
    });
  }, []);

  // Dashboard summary helpers
  const getNextPhrase = () => {
    const now = new Date();
    return phrases
      .filter(p => new Date(p.sendDateTime) > now)
      .sort((a, b) => new Date(a.sendDateTime).getTime() - new Date(b.sendDateTime).getTime())[0];
  };

  useEffect(() => {
    const nextPhrase = getNextPhrase();
    if (nextPhrase) {
      setNextScheduledTime(new Date(nextPhrase.sendDateTime));
    } else {
      setNextScheduledTime(undefined);
    }
  }, [phrases]);

  // Layout principal
    if (!coach || currentView === AppView.CoachLogin) {
      return <CoachLogin onLogin={handleLogin} />;
    }

        return (
    <div className="min-h-screen flex bg-[#f7f8fa] font-sans" style={{ fontFamily: 'Inter, DM Sans, sans-serif' }}>
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={handleLogout}
        nextScheduledTime={nextScheduledTime}
      />
      <main className="flex-1 px-6 py-8 ml-64 h-screen overflow-y-auto">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        {currentView === AppView.Dashboard && (
          <>
            {/* Bloques de resumen */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">Hola, {coach.name} <span className="text-2xl">👋</span></h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                  <div className="text-xs text-gray-500 mb-1">Contactos Activos</div>
                  <div className="text-2xl font-bold text-blue-700">{contacts.length}</div>
                </div>
                <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                  <div className="text-xs text-gray-500 mb-1">Próximo Envío</div>
                  <div className="text-2xl font-bold text-blue-700">{getNextPhrase() ? new Date(getNextPhrase().sendDateTime).toLocaleString('es-ES', { weekday: 'long', hour: '2-digit', minute: '2-digit' }) : 'Sin programar'}</div>
                </div>
                <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                  <div className="text-xs text-gray-500 mb-1">Frase Reciente</div>
                  <div className="text-base text-gray-700 text-center">{getNextPhrase() ? getNextPhrase().text : 'Aún no hay frases.'}</div>
                </div>
              </div>
            </div>
            {/* Bloque de PhraseManager */}
          <PhraseManager
            coach={coach}
            phrases={phrases}
            onAddPhrase={addPhrase}
            onDeletePhrase={deletePhrase}
            onGeneratePhrases={handleGeneratePhrases}
            isLoading={isLoading}
            onNavigate={setCurrentView}
          />
          </>
        )}
        {currentView === AppView.ManageContacts && (
          <ContactManager
            contacts={contacts}
            coach={coach}
            onAddContact={addContact}
            onDeleteContact={deleteContact}
            onNavigate={setCurrentView}
            onUpdateCoachBilling={handleUpdateCoachBilling}
          />
        )}
        {currentView === AppView.SimulateSend && (
          <MessageSimulator 
            phrases={phrases} 
            contacts={contacts} 
            onNavigate={setCurrentView}
            telegramBotToken={telegramBotToken}
          />
        )}
        {currentView === AppView.Settings && (
          <SettingsView
            currentBotToken={telegramBotToken}
            onSetBotToken={handleSetTelegramToken}
            onNavigate={setCurrentView}
          />
        )}
        {currentView === AppView.Payments && (
          <PaymentsView totalContacts={contacts.length} totalAmount={contacts.length * 2.5} onNavigate={setCurrentView} />
        )}
      </main>
    </div>
  );
};

export default App;