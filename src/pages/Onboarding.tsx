import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, LoadingSpinner } from '../components/ui';
import { FileUpload } from '../components/FileUpload';
import { UserProfile } from '../types';
import { useAppState } from '../services/appState';
import { 
  parseSalesCSV, 
  parsePurchasesCSV, 
  parseARAPCSV, 
  parseCashflowCSV, 
  parsePlanCSV 
} from '../utils/csvParser';
import { getAllDemoData, generateDemoCSV } from '../data/demoData';
import { Download, Upload, User, Settings, Database, RotateCcw } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const steps: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Профиль',
    description: 'Настройте основные параметры',
    icon: User
  },
  {
    id: 'data',
    title: 'Данные',
    description: 'Загрузите файлы или используйте демо',
    icon: Database
  },
  {
    id: 'settings',
    title: 'Настройки',
    description: 'Дополнительные параметры',
    icon: Settings
  }
];

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateProfile, updateDataFiles, setLoading, setError, clearData, hasData } = useAppState();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    role: 'CFO',
    baseCurrency: 'RUB',
    calendarType: 'standard'
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File}>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleFilesSelected = (files: File[]) => {
    files.forEach(file => {
      const fileName = file.name.toLowerCase();
      let fileType = '';
      
      if (fileName.includes('sales')) fileType = 'sales';
      else if (fileName.includes('purchases')) fileType = 'purchases';
      else if (fileName.includes('ar_ap') || fileName.includes('arap')) fileType = 'ar_ap';
      else if (fileName.includes('cashflow')) fileType = 'cashflow';
      else if (fileName.includes('plan')) fileType = 'plan';
      
      if (fileType) {
        setUploadedFiles(prev => ({ ...prev, [fileType]: file }));
      }
    });
  };

  const loadDemoData = () => {
    setLoading(true);
    try {
      const demoData = getAllDemoData();
      updateDataFiles(demoData);
      setValidationErrors([]);
    } catch (error) {
      setError(`Ошибка загрузки демо-данных: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadDemoCSV = (fileType: string) => {
    try {
      const csvContent = generateDemoCSV(fileType as any);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `demo_${fileType}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      setError(`Ошибка скачивания файла: ${error}`);
    }
  };

  const processUploadedFiles = async () => {
    setLoading(true);
    const errors: string[] = [];
    const dataFiles: any = {};

    try {
      for (const [fileType, file] of Object.entries(uploadedFiles)) {
        const text = await file.text();
        
        try {
          switch (fileType) {
            case 'sales':
              const salesResult = parseSalesCSV(text);
              if (salesResult.errors.length > 0) {
                errors.push(...salesResult.errors.map(e => `Sales: ${e}`));
              }
              dataFiles.sales = salesResult.data;
              break;
              
            case 'purchases':
              const purchasesResult = parsePurchasesCSV(text);
              if (purchasesResult.errors.length > 0) {
                errors.push(...purchasesResult.errors.map(e => `Purchases: ${e}`));
              }
              dataFiles.purchases = purchasesResult.data;
              break;
              
            case 'ar_ap':
              const arapResult = parseARAPCSV(text);
              if (arapResult.errors.length > 0) {
                errors.push(...arapResult.errors.map(e => `AR/AP: ${e}`));
              }
              dataFiles.ar_ap = arapResult.data;
              break;
              
            case 'cashflow':
              const cashflowResult = parseCashflowCSV(text);
              if (cashflowResult.errors.length > 0) {
                errors.push(...cashflowResult.errors.map(e => `Cashflow: ${e}`));
              }
              dataFiles.cashflow = cashflowResult.data;
              break;
              
            case 'plan':
              const planResult = parsePlanCSV(text);
              if (planResult.errors.length > 0) {
                errors.push(...planResult.errors.map(e => `Plan: ${e}`));
              }
              dataFiles.plan = planResult.data;
              break;
          }
        } catch (parseError) {
          errors.push(`Ошибка парсинга ${fileType}: ${parseError}`);
        }
      }
      
      // Добавляем конфигурацию эдвайзера
      dataFiles.advisor = getAllDemoData().advisor;
      
      updateDataFiles(dataFiles);
      setValidationErrors(errors);
      
    } catch (error) {
      setError(`Ошибка обработки файлов: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      updateProfile(profile);
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (Object.keys(uploadedFiles).length > 0) {
        await processUploadedFiles();
      }
      setCurrentStep(2);
    } else {
      // Завершение онбординга
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return profile.role && profile.baseCurrency;
    } else if (currentStep === 1) {
      return Object.keys(uploadedFiles).length > 0 || state.dataFiles.sales || state.dataFiles.ar_ap;
    }
    return true;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <Select
              label="Ваша роль"
              value={profile.role}
              onChange={(e) => handleProfileChange('role', e.target.value)}
              fullWidth
            >
              <option value="Owner">Владелец</option>
              <option value="CFO">CFO</option>
              <option value="Accountant">Главный бухгалтер</option>
            </Select>

            <Select
              label="Базовая валюта"
              value={profile.baseCurrency}
              onChange={(e) => handleProfileChange('baseCurrency', e.target.value)}
              fullWidth
            >
              <option value="RUB">Российский рубль (₽)</option>
              <option value="USD">Доллар США ($)</option>
              <option value="EUR">Евро (€)</option>
            </Select>

            <Select
              label="Тип календаря"
              value={profile.calendarType}
              onChange={(e) => handleProfileChange('calendarType', e.target.value as 'standard' | '13-period')}
              fullWidth
            >
              <option value="standard">Стандартный (12 месяцев)</option>
              <option value="13-period">13-периодный</option>
            </Select>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Загрузите данные или используйте демо
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Поддерживаемые файлы: sales.csv, purchases.csv, ar_ap.csv, cashflow.csv, plan.csv
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Загрузить файлы
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    accept=".csv"
                    multiple
                    onFilesSelected={handleFilesSelected}
                    className="mb-4"
                  />
                  
                  {Object.keys(uploadedFiles).length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Загруженные файлы:
                      </h4>
                      <ul className="text-sm text-gray-600">
                        {Object.keys(uploadedFiles).map(type => (
                          <li key={type}>• {type}.csv</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Демо-данные
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Используйте готовые демо-данные для быстрого старта
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      fullWidth
                      onClick={loadDemoData}
                      disabled={state.isLoading}
                    >
                      {state.isLoading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Загрузка...
                        </>
                      ) : (
                        'Использовать демо-данные'
                      )}
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 mb-2">Или скачайте примеры:</p>
                    {['sales', 'purchases', 'ar_ap', 'cashflow', 'plan'].map(type => (
                      <button
                        key={type}
                        onClick={() => downloadDemoCSV(type)}
                        className="flex items-center text-xs text-primary-600 hover:text-primary-700"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        {type}.csv
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {validationErrors.length > 0 && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-warning-800 mb-2">
                  Предупреждения при загрузке:
                </h4>
                <ul className="text-sm text-warning-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Настройка завершена!
              </h3>
              <p className="text-sm text-gray-600">
                Все готово для начала работы с AI Финансовый директор
              </p>
            </div>

            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-success-800 mb-2">
                Что доступно:
              </h4>
              <ul className="text-sm text-success-700 space-y-1">
                <li>• CFO дайджест с алертами</li>
                <li>• AR/AP центр с анализом задолженностей</li>
                <li>• План-факт анализ и прогнозы</li>
                <li>• Финансовый эдвайзер</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const Step = steps[currentStep];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Финансовый директор</h1>
              <p className="mt-2 text-lg text-gray-600">
                {hasData() ? 'Перенастройка финансового ассистента' : 'Добро пожаловать! Настроим ваш финансовый ассистент'}
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              {hasData() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Сбросить все данные и начать заново?')) {
                      clearData();
                      setCurrentStep(0);
                      setProfile({
                        role: 'CFO',
                        baseCurrency: 'RUB',
                        calendarType: 'standard'
                      });
                      setUploadedFiles({});
                      setValidationErrors([]);
                    }
                  }}
                  icon={RotateCcw}
                >
                  Начать заново
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Индикатор прогресса */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2
                  ${index <= currentStep 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
                  }
                `}>
                  <step.icon className="h-5 w-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-full h-1 mx-4
                    ${index < currentStep ? 'bg-primary-600' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <div key={step.id} className="text-center">
                <p className={`text-sm font-medium ${
                  index <= currentStep ? 'text-primary-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Контент шага */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Step.icon className="h-6 w-6 mr-3" />
              {Step.title}
            </CardTitle>
            <p className="text-sm text-gray-600">{Step.description}</p>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Навигация */}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Назад
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed() || state.isLoading}
          >
            {currentStep === steps.length - 1 ? 'Завершить' : 'Далее'}
          </Button>
        </div>

        {state.error && (
          <div className="mt-4 bg-danger-50 border border-danger-200 rounded-lg p-4">
            <p className="text-sm text-danger-700">{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
