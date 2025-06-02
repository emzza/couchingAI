import React from 'react';

interface ReturnPanelButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
}

const ReturnPanelButton: React.FC<ReturnPanelButtonProps> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-2 mb-8 px-5 py-3 bg-white border border-gray-200 rounded-xl shadow hover:bg-blue-50 hover:border-blue-300 text-gray-700 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
    aria-label="Volver al Panel"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
    {children || 'Volver al Panel'}
  </button>
);

export default ReturnPanelButton; 