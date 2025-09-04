import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { AlertSeverity } from '../../types';

interface AlertProps {
  severity: AlertSeverity;
  title: string;
  children?: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  severity,
  title,
  children,
  className = '',
  onDismiss
}) => {
  const severityConfig = {
    high: {
      bgColor: 'bg-danger-50',
      borderColor: 'border-danger-200',
      textColor: 'text-danger-800',
      icon: XCircle,
      iconColor: 'text-danger-500'
    },
    medium: {
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      textColor: 'text-warning-800',
      icon: AlertCircle,
      iconColor: 'text-warning-500'
    },
    low: {
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-800',
      icon: Info,
      iconColor: 'text-primary-500'
    },
    info: {
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      icon: Info,
      iconColor: 'text-gray-500'
    }
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className={`
      rounded-lg border p-4 
      ${config.bgColor} 
      ${config.borderColor} 
      ${className}
    `}>
      <div className="flex">
        <Icon className={`h-5 w-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${config.textColor}`}>
            {title}
          </h3>
          {children && (
            <div className={`mt-2 text-sm ${config.textColor}`}>
              {children}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`ml-auto pl-3 ${config.textColor} hover:opacity-70`}
          >
            <span className="sr-only">Закрыть</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
