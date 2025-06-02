import React, { useState, useRef } from 'react';
import { Contact, AppView, Coach, Platform } from '../types';
import { calculateBilling } from '../services/BillingService';
import ReturnPanelButton from './ui/ReturnPanelButton';

interface ContactManagerProps {
  contacts: Contact[];
  coach: Coach;
  onAddContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => void;
  onDeleteContact: (id: string) => void;
  onNavigate: (view: AppView) => void;
  onUpdateCoachBilling: (coachId: string, billingInfo: Coach['billingInfo']) => void;
}

interface CSVContact {
  name: string;
  telegramId?: string;
  whatsappNumber?: string;
}

const ContactManager: React.FC<ContactManagerProps> = ({ contacts, coach, onAddContact, onDeleteContact, onNavigate, onUpdateCoachBilling }) => {
  const [name, setName] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('telegram');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const telegramContacts = contacts.filter(c => c.platform === 'telegram');
  const whatsappContacts = contacts.filter(c => c.platform === 'whatsapp');
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && (telegramId.trim() || whatsappNumber.trim())) {
      onAddContact({ 
        name, 
        telegramId: selectedPlatform === 'telegram' ? telegramId : undefined,
        whatsappNumber: selectedPlatform === 'whatsapp' ? whatsappNumber : undefined,
        platform: selectedPlatform
      });
      const billingUpdate = calculateBilling(coach, 1);
      onUpdateCoachBilling(coach.id, {
        totalContacts: billingUpdate.totalContacts,
        totalBilled: billingUpdate.totalBilled,
        lastBillingDate: new Date().toISOString()
      });
      setName('');
      setTelegramId('');
      setWhatsappNumber('');
    }
  };

  const parseCSV = (csvText: string): CSVContact[] => {
    const lines = csvText.split('\n');
    const contacts: CSVContact[] = [];
    
    // Ignorar la primera línea si es el encabezado
    const startIndex = lines[0].toLowerCase().includes('nombre') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [name, id] = line.split(',').map(item => item.trim());
      if (name && id) {
        if (selectedPlatform === 'telegram') {
          contacts.push({ name, telegramId: id });
        } else {
          contacts.push({ name, whatsappNumber: id });
        }
      }
    }

    return contacts;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    setCsvSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const contacts = parseCSV(csvText);
        
        if (contacts.length === 0) {
          setCsvError('El archivo CSV no contiene contactos válidos.');
          return;
        }

        // Agregar cada contacto
        contacts.forEach(contact => {
          onAddContact({
            name: contact.name,
            telegramId: contact.telegramId,
            whatsappNumber: contact.whatsappNumber,
            platform: selectedPlatform
          });
        });

        // Actualizar facturación
        const billingUpdate = calculateBilling(coach, contacts.length);
        onUpdateCoachBilling(coach.id, {
          totalContacts: billingUpdate.totalContacts,
          totalBilled: billingUpdate.totalBilled,
          lastBillingDate: new Date().toISOString()
        });

        setCsvSuccess(`Se importaron ${contacts.length} contactos exitosamente.`);
      } catch (error) {
        setCsvError('Error al procesar el archivo CSV. Asegúrate de que el formato sea correcto.');
        console.error('Error procesando CSV:', error);
      }
    };

    reader.onerror = () => {
      setCsvError('Error al leer el archivo.');
    };

    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const template = selectedPlatform === 'telegram' 
      ? 'nombre,telegramId\nJuan Pérez,@juanperez\nMaría García,@mariagarcia'
      : 'nombre,whatsappNumber\nJuan Pérez,1234567890\nMaría García,0987654321';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_contactos_${selectedPlatform}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto w-full py-8">
      <ReturnPanelButton onClick={() => onNavigate(AppView.Dashboard)} />
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Gestionar Contactos</h2>

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

      {/* Sección de Carga Masiva */}
      <div className="bg-white p-8 rounded-2xl shadow-lg mb-10 w-full">
        <h3 className="text-xl font-semibold text-primary-600 mb-4">Carga Masiva de Contactos</h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Puedes cargar múltiples contactos a la vez usando un archivo CSV. El archivo debe tener dos columnas: nombre y {selectedPlatform === 'telegram' ? 'telegramId' : 'número de WhatsApp'}.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={handleDownloadTemplate}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-150"
            >
              Descargar Plantilla
            </button>
            <label className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition duration-150 cursor-pointer text-center">
              Cargar CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                ref={fileInputRef}
              />
            </label>
          </div>
          {csvError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
              <p className="font-bold">Error</p>
              <p>{csvError}</p>
            </div>
          )}
          {csvSuccess && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded" role="alert">
              <p className="font-bold">Éxito</p>
              <p>{csvSuccess}</p>
            </div>
          )}
        </div>
      </div>

      {/* Formulario de Contacto Individual */}
      <div className="bg-white p-8 rounded-2xl shadow-lg mb-10 w-full">
        <h3 className="text-xl font-semibold text-primary-600 mb-4">Añadir Nuevo Contacto</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              id="contactName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Ana Pérez"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              required
              aria-label="Nombre del contacto"
            />
          </div>
          {selectedPlatform === 'telegram' ? (
            <div>
              <label htmlFor="telegramId" className="block text-sm font-medium text-gray-700">
                ID de Telegram
              </label>
              <input
                id="telegramId"
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Ej: @anaperez_telegram"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
                aria-label="ID de Telegram del contacto"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700">
                Número de WhatsApp
              </label>
              <input
                id="whatsappNumber"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Ej: 1234567890"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
                aria-label="Número de WhatsApp del contacto"
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition duration-150"
          >
            Añadir Contacto
          </button>
        </form>
      </div>

      {/* Lista de Contactos */}
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full">
        <h3 className="text-xl font-semibold text-primary-600 mb-4">
          Contactos de {selectedPlatform === 'telegram' ? 'Telegram' : 'WhatsApp'} 
          <span className="text-gray-400 font-normal">
            ({selectedPlatform === 'telegram' ? telegramContacts.length : whatsappContacts.length})
          </span>
        </h3>
        {contacts.length === 0 ? (
          <p className="text-gray-500">Aún no has añadido contactos.</p>
        ) : (
          <ul className="space-y-3 max-h-96 overflow-y-auto">
            {(selectedPlatform === 'telegram' ? telegramContacts : whatsappContacts).map((contact) => (
              <li key={`${contact.id}-${contact.platform}`} className="p-4 bg-gray-50 rounded-lg shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{contact.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedPlatform === 'telegram' 
                      ? `ID Telegram: ${contact.telegramId}`
                      : `WhatsApp: ${contact.whatsappNumber}`
                    }
                  </p>
                  <p className="text-xs text-gray-400">Añadido: {formatDate(contact.createdAt)}</p>
                </div>
                <button
                  onClick={() => onDeleteContact(contact.id)}
                  className="ml-4 text-red-500 hover:text-red-700 transition duration-150"
                  title="Eliminar contacto"
                  aria-label={`Eliminar contacto ${contact.name}`}
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
  );
};

export default ContactManager;