import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { Card, Button, Alert } from './ui';
import { CFOAlert as CFOAlertType } from '../types';

interface CFOAlertProps {
  alert: CFOAlertType;
  className?: string;
}

export const CFOAlert: React.FC<CFOAlertProps> = ({ alert, className = '' }) => {
  const navigate = useNavigate();
  const [showExplanation, setShowExplanation] = React.useState(false);

  const handleNavigate = () => {
    if (alert.ctaRoute) {
      navigate(alert.ctaRoute);
    }
  };

  const getSeverityColor = (severity: CFOAlertType['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-l-danger-500 bg-danger-50';
      case 'medium':
        return 'border-l-warning-500 bg-warning-50';
      case 'low':
        return 'border-l-primary-500 bg-primary-50';
      case 'info':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getSeverityText = (severity: CFOAlertType['severity']) => {
    switch (severity) {
      case 'high':
        return 'Критично';
      case 'medium':
        return 'Важно';
      case 'low':
        return 'Внимание';
      case 'info':
        return 'Информация';
      default:
        return 'Уведомление';
    }
  };

  return (
    <Card className={`border-l-4 ${getSeverityColor(alert.severity)} ${className}`} padding="md">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-2">
            <span className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${alert.severity === 'high' ? 'bg-danger-100 text-danger-800' : ''}
              ${alert.severity === 'medium' ? 'bg-warning-100 text-warning-800' : ''}
              ${alert.severity === 'low' ? 'bg-primary-100 text-primary-800' : ''}
              ${alert.severity === 'info' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              {getSeverityText(alert.severity)}
            </span>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="ml-2 text-gray-400 hover:text-gray-600"
              title="Почему это важно?"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {alert.title}
          </h3>
          
          <p className="text-sm text-gray-700 mb-3">
            {alert.reason}
          </p>

          {showExplanation && (
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Почему это важно:</strong> {alert.why_link}
              </p>
            </div>
          )}
        </div>

        <div className="ml-4 flex-shrink-0">
          {alert.ctaRoute && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleNavigate}
              icon={ArrowRight}
              iconPosition="right"
            >
              Перейти
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
