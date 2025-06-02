import React, { useState } from 'react';

interface CoachLoginProps {
  onLogin: (name: string) => void;
}

const CoachLogin: React.FC<CoachLoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f8fa] px-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md mx-auto flex flex-col items-center">
        <img src="https://picsum.photos/seed/coachlogin/180/180" alt="Logo de la App" className="mx-auto mb-8 rounded-full shadow-lg border-4 border-blue-100" />
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">¡Bienvenido a CoachAI!</h1>
        <p className="text-center text-gray-500 mb-8 text-lg">Inicia sesión para inspirar y motivar a tu comunidad.</p>
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div>
            <label htmlFor="coachName" className="block text-sm font-medium text-gray-700 mb-2">
              Tu Nombre o Email
            </label>
            <input
              id="coachName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Alex Coachman"
              className="w-full px-5 py-4 border border-gray-200 rounded-xl shadow-sm focus:ring-blue-200 focus:border-blue-400 text-base transition duration-150 bg-gray-50"
              required
              aria-label="Tu Nombre o Email"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-lg font-bold shadow-lg hover:scale-105 hover:from-indigo-600 hover:to-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            ¡Comenzar!
          </button>
        </form>
      </div>
    </div>
  );
};

export default CoachLogin;