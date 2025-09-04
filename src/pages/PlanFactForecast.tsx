import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  AlertCircle,
  Info,
  Calendar
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, Button, Select } from '../components/ui';
import { useAppState } from '../services/appState';
import { calculatePlanFactSeries } from '../utils/calculations';
import { format } from 'date-fns';

export const PlanFactForecast: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  
  const [selectedMetric, setSelectedMetric] = useState<'Revenue' | 'CF_IN' | 'CF_OUT'>('Revenue');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Вычисляем серии данных
  const series = useMemo(() => {
    if (!state.dataFiles.sales || !state.dataFiles.plan) return null;
    
    return calculatePlanFactSeries(
      state.dataFiles.sales,
      state.dataFiles.plan,
      selectedMetric
    );
  }, [state.dataFiles.sales, state.dataFiles.plan, selectedMetric]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getMetricName = (metric: string) => {
    switch (metric) {
      case 'Revenue':
        return 'Выручка';
      case 'CF_IN':
        return 'Приток ДС';
      case 'CF_OUT':
        return 'Отток ДС';
      default:
        return metric;
    }
  };

  // Подготавливаем данные для графика
  const chartData = useMemo(() => {
    if (!series) return [];

    const data: any[] = [];
    const maxLength = Math.max(
      series.plan.length,
      series.fact.length,
      series.forecast.length
    );

    for (let i = 0; i < maxLength; i++) {
      const planPoint = series.plan[i];
      const factPoint = series.fact[i];
      const forecastPoint = series.forecast[i];

      if (planPoint) {
        data.push({
          period: format(new Date(planPoint.x + '-01'), 'MMM yyyy'),
          periodKey: planPoint.x,
          plan: planPoint.y,
          fact: factPoint?.y || null,
          forecast: forecastPoint?.y || null
        });
      }
    }

    return data;
  }, [series]);

  // Вычисляем общие показатели
  const summary = useMemo(() => {
    if (!series) return null;

    const lastPlan = series.plan[series.plan.length - 1];
    const lastFact = series.fact[series.fact.length - 1];
    const lastForecast = series.forecast[series.forecast.length - 1];

    if (!lastPlan || !lastFact) return null;

    const planVsFact = lastPlan.y > 0 ? ((lastFact.y - lastPlan.y) / lastPlan.y) * 100 : 0;
    const trend = series.fact.length >= 2 ? 
      series.fact[series.fact.length - 1].y - series.fact[series.fact.length - 2].y : 0;

    return {
      lastPlan: lastPlan.y,
      lastFact: lastFact.y,
      lastForecast: lastForecast?.y || 0,
      planVsFact,
      trend,
      period: lastPlan.x
    };
  }, [series]);

  if (!state.dataFiles.sales || !state.dataFiles.plan) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Данные для анализа не найдены
            </h2>
            <p className="text-gray-600 mb-8">
              Загрузите файлы sales.csv и plan.csv для анализа план-факт
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
                  План-Факт-Прогноз
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Анализ выполнения планов и прогнозирование показателей
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
              >
                <option value="Revenue">Выручка</option>
                <option value="CF_IN">Приток ДС</option>
                <option value="CF_OUT">Отток ДС</option>
              </Select>
              <Select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
              >
                <option value="line">Линейный график</option>
                <option value="bar">Столбчатая диаграмма</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Сводные показатели */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-primary-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      План ({format(new Date(summary.period + '-01'), 'MM.yyyy')})
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.lastPlan)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-8 w-8 text-success-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Факт</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.lastFact)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {summary.planVsFact >= 0 ? (
                      <TrendingUp className="h-8 w-8 text-success-500" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-danger-500" />
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">План vs Факт</p>
                    <p className={`text-2xl font-bold ${
                      summary.planVsFact >= 0 ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {summary.planVsFact > 0 ? '+' : ''}{summary.planVsFact.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {summary.trend >= 0 ? (
                      <TrendingUp className="h-8 w-8 text-primary-500" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-warning-500" />
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Тренд</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.trend >= 0 ? '+' : ''}{formatCurrency(summary.trend)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* График */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                График {getMetricName(selectedMetric)}
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                  <span>План</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                  <span>Факт</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                  <span>Прогноз</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(1)}M`;
                          } else if (value >= 1000) {
                            return `${(value / 1000).toFixed(0)}K`;
                          }
                          return value.toString();
                        }}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          value ? formatCurrency(value) : 'Нет данных',
                          name === 'plan' ? 'План' : name === 'fact' ? 'Факт' : 'Прогноз'
                        ]}
                        labelFormatter={(label) => `Период: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="plan" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        connectNulls={false}
                        name="План"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="fact" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        connectNulls={false}
                        name="Факт"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 4 }}
                        connectNulls={false}
                        name="Прогноз"
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(1)}M`;
                          } else if (value >= 1000) {
                            return `${(value / 1000).toFixed(0)}K`;
                          }
                          return value.toString();
                        }}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          value ? formatCurrency(value) : 'Нет данных',
                          name === 'plan' ? 'План' : name === 'fact' ? 'Факт' : 'Прогноз'
                        ]}
                        labelFormatter={(label) => `Период: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="plan" fill="#3b82f6" name="План" />
                      <Bar dataKey="fact" fill="#22c55e" name="Факт" />
                      <Bar dataKey="forecast" fill="#f59e0b" name="Прогноз" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Недостаточно данных для построения графика
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Таблица данных */}
        {series && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Детализация по периодам</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Период
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        План
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Факт
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Прогноз
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Отклонение
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {series.plan.map((planPoint, index) => {
                      const factPoint = series.fact[index];
                      const forecastPoint = series.forecast[index];
                      const deviation = factPoint && planPoint.y > 0 ? 
                        ((factPoint.y - planPoint.y) / planPoint.y) * 100 : 0;
                      
                      return (
                        <tr key={planPoint.x} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {format(new Date(planPoint.x + '-01'), 'MMMM yyyy')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(planPoint.y)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-900">
                              {factPoint ? formatCurrency(factPoint.y) : '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-500">
                              {forecastPoint ? formatCurrency(forecastPoint.y) : '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {factPoint ? (
                              <span className={`text-sm font-medium ${
                                deviation >= 0 ? 'text-success-600' : 'text-danger-600'
                              }`}>
                                {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
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
        )}

        {/* Инсайты */}
        {series && series.insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Инсайты и рекомендации
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {series.insights.map((insight, index) => (
                  <div key={index} className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-primary-500 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
