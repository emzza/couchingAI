import React, { useState, useCallback } from 'react';
import { Phrase, Coach, AppView } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface PhraseManagerProps {
  coach: Coach;
  phrases: Phrase[];
  onAddPhrase: (phrase: Omit<Phrase, 'id' | 'coachName' | 'createdAt'>) => void;
  onDeletePhrase: (id: string) => void;
  onGeneratePhrases: (basePhrase: string) => Promise<string[]>;
  isLoading: boolean;
  onNavigate: (view: AppView) => void;
}

const PhraseManager: React.FC<PhraseManagerProps> = ({
  coach,
  phrases,
  onAddPhrase,
  onDeletePhrase,
  onGeneratePhrases,
  isLoading,
  onNavigate,
}) => {
  const [newPhraseText, setNewPhraseText] = useState('');
  const [sendDateTime, setSendDateTime] = useState('');
  const [aiBasePhrase, setAiBasePhrase] = useState('');
  const [suggestedPhrases, setSuggestedPhrases] = useState<string[]>([]);

  const handleAddPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPhraseText.trim() && sendDateTime) {
      onAddPhrase({ text: newPhraseText, sendDateTime });
      setNewPhraseText('');
      // setSendDateTime(''); // Keep datetime for potentially adding multiple phrases for same time
    }
  };

  const handleGenerate = async () => {
    if (aiBasePhrase.trim()) {
      setSuggestedPhrases([]); 
      const suggestions = await onGeneratePhrases(aiBasePhrase);
      setSuggestedPhrases(suggestions);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setNewPhraseText(suggestion);
    setSuggestedPhrases([]); 
    setAiBasePhrase(''); 
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      // Using Spanish locale explicitly. Adjust options as needed.
      return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return 'Fecha Inválida';
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#f7f8fa] px-2">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Crear Frase Motivacional</h2>
        <p className="text-base text-gray-500 mb-6">Inspirá a tu comunidad con una frase única</p>
        <form onSubmit={handleAddPhrase} className="flex flex-col gap-6">
          <div>
            <label htmlFor="phraseText" className="block text-sm font-medium text-gray-700 mb-2">
              Frase Motivacional
            </label>
            <div className="relative flex items-center">
              <textarea
                id="phraseText"
                value={newPhraseText}
                onChange={(e) => setNewPhraseText(e.target.value)}
                placeholder="Escribe tu frase motivacional aquí..."
                className="w-full px-5 py-4 pr-16 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-base font-normal transition duration-150 resize-none font-sans"
                rows={3}
                required
                aria-label="Texto de la frase motivacional"
                style={{ fontFamily: 'Inter, DM Sans, sans-serif' }}
              />
              <button
                type="button"
                onClick={() => { setAiBasePhrase(newPhraseText); handleGenerate(); }}
                disabled={isLoading || !newPhraseText.trim()}
                className={`absolute right-2 bottom-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md ${
                  isLoading || !newPhraseText.trim()
                    ? 'bg-blue-100 text-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title="Generar variantes con IA"
              >
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                    <span>Generar variantes</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {suggestedPhrases.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {suggestedPhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(phrase)}
                  className="bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-blue-700 hover:bg-blue-100 hover:text-blue-900 shadow-sm transition-all duration-150 font-sans"
                  style={{ fontFamily: 'Inter, DM Sans, sans-serif' }}
                >
                  {phrase}
                </button>
              ))}
            </div>
          )}
          <div>
            <label htmlFor="sendDateTime" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha y Hora de Envío
            </label>
            <div className="relative flex items-center">
              <input
                id="sendDateTime"
                type="datetime-local"
                value={sendDateTime}
                onChange={(e) => setSendDateTime(e.target.value)}
                className="w-full px-5 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-base font-normal font-sans"
                required
                aria-label="Fecha y hora de envío"
                style={{ fontFamily: 'Inter, DM Sans, sans-serif' }}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row mt-2">
           
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-lg bg-gray-900 text-white text-base font-semibold shadow-md hover:bg-gray-800 transition-all duration-200"
            >
              Guardar y Programar
            </button>
          </div>
        </form>
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          <h3 className="text-xl font-semibold text-primary-600 mb-4">📚 Tus Frases Guardadas <span className="text-gray-400 font-normal">({phrases.length})</span></h3>
          {phrases.length === 0 ? (
            <p className="text-gray-500">Aún no has añadido frases. ¡Comienza a crear tus mensajes motivacionales!</p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {phrases.map((phrase) => (
                <li key={phrase.id} className="p-4 bg-[#f7f8fa] rounded-xl shadow-sm flex justify-between items-start group hover:bg-indigo-50 transition-colors duration-200">
                  <div>
                    <p className="font-medium text-gray-800 group-hover:text-indigo-700 text-lg">{phrase.text}</p>
                    <p className="text-sm text-gray-500">
                      Programada para: {formatDate(phrase.sendDateTime)}
                    </p>
                    <p className="text-xs text-gray-400">Añadida: {formatDate(phrase.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => onDeletePhrase(phrase.id)}
                    className="ml-4 text-red-500 hover:text-red-700 transition duration-150 opacity-0 group-hover:opacity-100"
                    title="Eliminar frase"
                    aria-label={`Eliminar frase: ${phrase.text.substring(0,20)}...`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153-.139 2.306-.257 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhraseManager;