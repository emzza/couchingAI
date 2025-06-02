import React from 'react';
import { Coach, AppView } from '../types';
import { getBillingSummary } from '../services/BillingService';

interface DashboardProps {
  coach: Coach;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className={`bg-white p-6 rounded-xl shadow-lg border-l-4 ${color} hover:shadow-xl transition-all duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
        {icon}
      </div>
    </div>
  </div>
);

const ActionCard: React.FC<{ onClick: () => void; icon: React.ReactNode; title: string; description: string; color: string }> = ({ 
  onClick, 
  icon, 
  title, 
  description,
  color 
}) => (
  <button
    onClick={onClick}
    className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-opacity-50 text-left w-full border-t-4 border-${color}-500`}
    aria-label={title}
  >
    <div className="flex items-start space-x-4">
      <div className={`p-3 rounded-full bg-${color}-100`}>
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  </button>
);

const Dashboard: React.FC<DashboardProps> = ({ coach, onNavigate, onLogout }) => {
  const billingSummary = getBillingSummary(coach);
  const commonIconClass = "h-6 w-6";

  return (
    <div className="animate-fadeIn">
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">¡Bienvenido, {coach.name}!</h1>
            <p className="text-gray-600 mt-2 text-lg">Panel de Control</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-6 py-3 text-red-600 hover:text-red-700 transition-colors duration-200 bg-white rounded-lg shadow-sm hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <StatCard
          title="Total de Contactos"
          value={billingSummary.totalContacts}
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${commonIconClass} text-blue-500`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>}
          color="border-blue-500"
        />
        <StatCard
          title="Total Facturado"
          value={billingSummary.totalBilled}
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${commonIconClass} text-green-500`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>}
          color="border-green-500"
        />
        <StatCard
          title="Última Facturación"
          value={billingSummary.lastBillingDate}
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${commonIconClass} text-purple-500`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>}
          color="border-purple-500"
        />
      </div>
    </div>

  );
};

export default Dashboard;