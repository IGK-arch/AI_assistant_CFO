import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calculator, 
  Download, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '../components/ui';
import { useAppState } from '../services/appState';
import { calculateAdvisorRecommendations } from '../utils/calculations';
import { exportToCSV } from '../utils/csvParser';

export const FinancialAdvisor: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  
  const [amount, setAmount] = useState<number>(1000000);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [goal, setGoal] = useState<'working_capital' | 'investment' | 'gap_closure'>('working_capital');

  // Получаем конфигурацию инструментов
  const advisorConfig = state.dataFiles.advisor;

  // Вычисляем рекомендации
  const recommendations = useMemo(() => {
    if (!advisorConfig || !amount || !termMonths) return null;
    
    return calculateAdvisorRecommendations(
      advisorConfig.instruments,
      amount,
      termMonths,
      goal
    );
  }, [advisorConfig, amount, termMonths, goal]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(2)}%`;
  };

  const handleExport = () => {
    if (!recommendations) return;
    
    const dataToExport = recommendations.items.map(item => ({
      instrument: item.name,
      effective_rate: item.effectiveRate,
      total_cost: item.totalCost,
      explanation: item.explanation,
      recommended: item.id === recommendations.recommendation.id ? 'Да' : 'Нет'
    }));
    
    exportToCSV(dataToExport, `advisor_comparison_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const getGoalDescription = (goalType: string) => {
    switch (goalType) {
      case 'working_capital':
        return 'Финансирование оборотного капитала';
      case 'investment':
        return 'Инвестиционные проекты';
      case 'gap_closure':
        return 'Закрытие кассового разрыва';
      default:
        return 'Общее финансирование';
    }
  };

  if (!advisorConfig) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Конфигурация эдвайзера не найдена
            </h2>
            <p className="text-gray-600 mb-8">
              Загрузите файл конфигурации финансовых инструментов
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
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                icon={ArrowLeft}
              >
                Назад
              </Button>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Финансовый эдвайзер
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Сравнение финансовых инструментов и рекомендации
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {recommendations && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExport}
                  icon={Download}
                >
                  Экспорт
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Параметры */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Параметры расчета
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Сумма финансирования
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="Введите сумму"
                    fullWidth
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(amount)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Срок (месяцев)
                  </label>
                  <Select
                    value={termMonths}
                    onChange={(e) => setTermMonths(Number(e.target.value))}
                    fullWidth
                  >
                    <option value={3}>3 месяца</option>
                    <option value={6}>6 месяцев</option>
                    <option value={12}>12 месяцев</option>
                    <option value={18}>18 месяцев</option>
                    <option value={24}>24 месяца</option>
                    <option value={36}>36 месяцев</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цель финансирования
                  </label>
                  <Select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as any)}
                    fullWidth
                  >
                    <option value="working_capital">Оборотный капитал</option>
                    <option value="investment">Инвестиции</option>
                    <option value="gap_closure">Закрытие разрыва</option>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {getGoalDescription(goal)}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Доступно инструментов:
                  </h4>
                  <p className="text-2xl font-bold text-primary-600">
                    {advisorConfig.instruments.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Результаты */}
          <div className="lg:col-span-2">
            {recommendations ? (
              <div className="space-y-6">
                {/* Рекомендация */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-success-500" />
                      Рекомендация
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const recommended = recommendations.items.find(
                        item => item.id === recommendations.recommendation.id
                      );
                      return recommended ? (
                        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-success-800 mb-2">
                            {recommended.name}
                          </h3>
                          <p className="text-success-700 mb-3">
                            {recommendations.recommendation.why}
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-success-600">Эффективная ставка:</p>
                              <p className="text-xl font-bold text-success-800">
                                {formatPercent(recommended.effectiveRate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-success-600">Общая стоимость:</p>
                              <p className="text-xl font-bold text-success-800">
                                {formatCurrency(recommended.totalCost)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>

                {/* Сравнительная таблица */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Сравнение инструментов
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Инструмент
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Эфф. ставка
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Общая стоимость
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Детали
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Статус
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {recommendations.items.map((item, index) => {
                            const isRecommended = item.id === recommendations.recommendation.id;
                            const isLowest = index === 0; // Уже отсортированы по эффективной ставке
                            
                            return (
                              <tr key={item.id} className={isRecommended ? 'bg-success-50' : 'hover:bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <div className={`text-sm font-medium ${
                                    isLowest ? 'text-success-600' : 'text-gray-900'
                                  }`}>
                                    {formatPercent(item.effectiveRate)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <div className="text-sm text-gray-900">
                                    {formatCurrency(item.totalCost)}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-xs text-gray-500 max-w-xs">
                                    {item.explanation}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {isRecommended && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                                      Рекомендуется
                                    </span>
                                  )}
                                  {isLowest && !isRecommended && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                      Самая низкая ставка
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Объяснения */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Как читать результаты
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>
                        <strong>Эффективная ставка</strong> — реальная стоимость капитала с учетом всех комиссий и платежей.
                      </p>
                      <p>
                        <strong>Общая стоимость</strong> — полная сумма переплаты за весь срок финансирования.
                      </p>
                      <p>
                        <strong>Рекомендация</strong> учитывает не только стоимость, но и соответствие цели финансирования.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Укажите параметры расчета
                  </h3>
                  <p className="text-gray-600">
                    Заполните сумму и срок для получения рекомендаций
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
