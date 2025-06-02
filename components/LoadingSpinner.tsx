
import React from 'react';

interface LoadingSpinnerProps {
  small?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ small }) => {
  const sizeClass = small ? 'w-5 h-5' : 'w-8 h-8';
  const borderClass = small ? 'border-2' : 'border-4';

  return (
    <div className={`inline-block ${sizeClass} animate-spin rounded-full ${borderClass} border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`} role="status">
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Cargando...
      </span>
    </div>
  );
};

export default LoadingSpinner;