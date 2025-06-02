import React from 'react';
import { AppView } from '../types';
import ReturnPanelButton from './ui/ReturnPanelButton';

const billingHistory = [
  { date: '1 de mayo de 2024', amount: 300, status: 'Pagado' },
  { date: '1 de abril de 2024', amount: 250, status: 'Pagado' },
  { date: '1 de marzo de 2024', amount: 200, status: 'Pagado' },
  { date: '1 de febrero de 2024', amount: 150, status: 'Pagado' },
  { date: '1 de enero de 2024', amount: 100, status: 'Pagado' },
];

const PaymentsView: React.FC<{ totalContacts: number; totalAmount: number; onNavigate: (view: AppView) => void; }> = ({ totalContacts, totalAmount, onNavigate }) => (
  <div className="max-w-4xl mx-auto w-full py-8 animate-fadeIn">
    <ReturnPanelButton onClick={() => onNavigate(AppView.Dashboard)} />
    <h2 className="text-3xl font-bold text-gray-900 mb-8">Facturación</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
        <div className="text-xs text-gray-500 mb-1">Contactos activos</div>
        <div className="text-3xl font-bold text-gray-900">{totalContacts}</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
        <div className="text-xs text-gray-500 mb-1">Importe total</div>
        <div className="text-3xl font-bold text-gray-900">${totalAmount}</div>
      </div>
    </div>
    <div className="bg-white p-8 rounded-2xl shadow-lg w-full mb-10">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de facturación</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="py-2 px-4 font-medium">FECHA</th>
              <th className="py-2 px-4 font-medium">IMPORTE</th>
              <th className="py-2 px-4 font-medium">ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {billingHistory.map((item, idx) => (
              <tr key={idx} className="border-b last:border-b-0">
                <td className="py-2 px-4">{item.date}</td>
                <td className="py-2 px-4">${item.amount}</td>
                <td className="py-2 px-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-gray-500 text-sm mb-6 mt-6">La facturación es mensual basada en el número de contactos activos en tu cuenta.</p>
      <div className="flex justify-end">
        <button className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-all">Pagar Ahora</button>
      </div>
    </div>
  </div>
);

export default PaymentsView; 