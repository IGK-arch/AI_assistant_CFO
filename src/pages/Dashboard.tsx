import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calculator,
  Calendar,
  Filter,
  RotateCcw,
  Bot,
  Target
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Select } from '../components/ui';
import { CFOAlert } from '../components/CFOAlert';
import { useAppState } from '../services/appState';
import { calculateCFODigest } from '../utils/calculations';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateFilters, clearData } = useAppState();
  const [selectedPeriod, setSelectedPeriod] = React.useState('current-month');

  const handleReset = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все данные? Это действие нельзя отменить.')) {
      clearData();
      navigate('/');
    }
  };

  // Вычисляем алерты для дайджеста
  const alerts = useMemo(() => {
    if (!state.dataFiles) return [];

    return calculateCFODigest(
      state.dataFiles.sales || [],
      state.dataFiles.purchases || [],
      state.dataFiles.ar_ap || [],
      state.dataFiles.cashflow || [],
      state.dataFiles.plan || []
    );
  }, [state.dataFiles]);

  // Вычисляем основные метрики
  const metrics = useMemo(() => {
    const { dataFiles } = state;
    
    if (!dataFiles.sales && !dataFiles.ar_ap) {
      return {
        totalRevenue: 0,
        totalAR: 0,
        totalAP: 0,
        cashFlow: 0
      };
    }

    const currentMonth = format(new Date(), 'yyyy-MM');
    
    // Выручка за текущий месяц
    const totalRevenue = (dataFiles.sales || [])
      .filter(sale => sale.doc_date.startsWith(currentMonth))
      .reduce((sum, sale) => sum + sale.amount, 0);

    // Дебиторская задолженность (неоплаченная)
    const totalAR = (dataFiles.ar_ap || [])
      .filter(record => record.type === 'AR' && !record.paid_date)
      .reduce((sum, record) => sum + record.amount, 0);

    // Кредиторская задолженность (неоплаченная)
    const totalAP = (dataFiles.ar_ap || [])
      .filter(record => record.type === 'AP' && !record.paid_date)
      .reduce((sum, record) => sum + record.amount, 0);

    // Чистый денежный поток за текущий месяц
    const cashFlow = (dataFiles.cashflow || [])
      .filter(cf => cf.date.startsWith(currentMonth))
      .reduce((sum, cf) => sum + cf.amount, 0);

    return {
      totalRevenue,
      totalAR,
      totalAP,
      cashFlow
    };
  }, [state.dataFiles]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    
    let startDate: string;
    let endDate: string;
    
    const now = new Date();
    
    switch (period) {
      case 'current-month':
        startDate = format(startOfMonth(now), 'yyyy-MM-dd');
        endDate = format(endOfMonth(now), 'yyyy-MM-dd');
        break;
      case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
        endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        startDate = format(quarterStart, 'yyyy-MM-dd');
        endDate = format(now, 'yyyy-MM-dd');
        break;
      default:
        startDate = format(startOfMonth(now), 'yyyy-MM-dd');
        endDate = format(endOfMonth(now), 'yyyy-MM-dd');
    }
    
    updateFilters({
      dateRange: { startDate, endDate }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: state.profile?.baseCurrency || 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Если нет данных, показываем заглушку
  if (!state.dataFiles.sales && !state.dataFiles.ar_ap) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Добро пожаловать в AI Финансовый директор
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Загрузите данные для начала работы с финансовой аналитикой
            </p>
            <Button onClick={() => navigate('/')}>
              Загрузить данные
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                CFO Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Добро пожаловать, {state.profile?.role}! Вот ваша сводка за период
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <Select
                  value={selectedPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                >
                  <option value="current-month">Текущий месяц</option>
                  <option value="last-month">Прошлый месяц</option>
                  <option value="quarter">Текущий квартал</option>
                </Select>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                icon={RotateCcw}
              >
                Сбросить данные
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CFO Дайджест */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              CFO Дайджест
            </h2>
            <span className="text-sm text-gray-500">
              {alerts.length} активных алертов
            </span>
          </div>

          {alerts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {alerts.map((alert) => (
                <CFOAlert key={alert.id} alert={alert} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-success-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Все под контролем!
                </h3>
                <p className="text-gray-600">
                  Критических проблем не обнаружено. Финансовые показатели в норме.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ключевые метрики */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Ключевые показатели
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-success-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Выручка</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(metrics.totalRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-primary-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Дебиторка</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(metrics.totalAR)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingDown className="h-8 w-8 text-danger-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Кредиторка</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(metrics.totalAP)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className={`h-8 w-8 ${
                      metrics.cashFlow >= 0 ? 'text-success-500' : 'text-danger-500'
                    }`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Денежный поток</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(metrics.cashFlow)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Быстрые действия
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <Card onClick={() => navigate('/ai-assistant')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-6 w-6 mr-3 text-primary-500" />
                  AI Ассистент
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Умный помощник для финансового анализа
                </p>
                <Button variant="ghost" size="sm" fullWidth>
                  Открыть →
                </Button>
              </CardContent>
            </Card>

            <Card onClick={() => navigate('/scenarios')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-6 w-6 mr-3 text-purple-500" />
                  Сценарии
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Моделирование бизнес-сценариев
                </p>
                <Button variant="ghost" size="sm" fullWidth>
                  Открыть →
                </Button>
              </CardContent>
            </Card>

            <Card onClick={() => navigate('/ar-ap')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-6 w-6 mr-3 text-blue-500" />
                  AR/AP Центр
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Управление задолженностями
                </p>
                <Button variant="ghost" size="sm" fullWidth>
                  Открыть →
                </Button>
              </CardContent>
            </Card>

            <Card onClick={() => navigate('/plan-fact')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-6 w-6 mr-3 text-success-500" />
                  План-Факт-Прогноз
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Анализ планов и прогнозы
                </p>
                <Button variant="ghost" size="sm" fullWidth>
                  Открыть →
                </Button>
              </CardContent>
            </Card>

            <Card onClick={() => navigate('/advisor')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-6 w-6 mr-3 text-warning-500" />
                  Финансовый эдвайзер
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Сравнение инструментов
                </p>
                <Button variant="ghost" size="sm" fullWidth>
                  Открыть →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
