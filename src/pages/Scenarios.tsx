import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Pause,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Zap,
  DollarSign,
  Users,
  ShoppingCart,
  Settings,
  Plus,
  Save,
  Download
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '../components/ui';
import { useAppState } from '../services/appState';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ScenarioParameter {
  id: string;
  name: string;
  currentValue: number;
  scenarioValue: number;
  unit: string;
  min: number;
  max: number;
  step: number;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  parameters: ScenarioParameter[];
  isActive: boolean;
}

interface ScenarioResult {
  metric: string;
  current: number;
  scenario: number;
  change: number;
  changePercent: number;
}

const defaultScenarios: Scenario[] = [
  {
    id: 'growth',
    name: 'Сценарий роста',
    description: 'Увеличение продаж и масштабирование бизнеса',
    icon: TrendingUp,
    isActive: false,
    parameters: [
      { id: 'revenue_growth', name: 'Рост выручки', currentValue: 0, scenarioValue: 20, unit: '%', min: -50, max: 100, step: 5 },
      { id: 'price_increase', name: 'Повышение цен', currentValue: 0, scenarioValue: 10, unit: '%', min: -20, max: 50, step: 2 },
      { id: 'volume_increase', name: 'Рост объема продаж', currentValue: 0, scenarioValue: 15, unit: '%', min: -30, max: 80, step: 5 },
      { id: 'new_customers', name: 'Новые клиенты', currentValue: 0, scenarioValue: 25, unit: '%', min: 0, max: 100, step: 5 },
      { id: 'marketing_spend', name: 'Маркетинговые затраты', currentValue: 0, scenarioValue: 30, unit: '%', min: -50, max: 200, step: 10 }
    ]
  },
  {
    id: 'optimization',
    name: 'Оптимизация затрат',
    description: 'Снижение расходов и повышение эффективности',
    icon: Target,
    isActive: false,
    parameters: [
      { id: 'opex_reduction', name: 'Сокращение OPEX', currentValue: 0, scenarioValue: -15, unit: '%', min: -50, max: 20, step: 2 },
      { id: 'cogs_optimization', name: 'Оптимизация себестоимости', currentValue: 0, scenarioValue: -8, unit: '%', min: -30, max: 10, step: 2 },
      { id: 'staff_optimization', name: 'Оптимизация персонала', currentValue: 0, scenarioValue: -10, unit: '%', min: -40, max: 50, step: 5 },
      { id: 'automation', name: 'Автоматизация процессов', currentValue: 0, scenarioValue: -12, unit: '%', min: -50, max: 0, step: 2 },
      { id: 'supplier_negotiation', name: 'Переговоры с поставщиками', currentValue: 0, scenarioValue: -5, unit: '%', min: -25, max: 5, step: 1 }
    ]
  },
  {
    id: 'crisis',
    name: 'Антикризисный сценарий',
    description: 'Действия в условиях экономического спада',
    icon: AlertTriangle,
    isActive: false,
    parameters: [
      { id: 'revenue_decline', name: 'Падение выручки', currentValue: 0, scenarioValue: -25, unit: '%', min: -70, max: 0, step: 5 },
      { id: 'bad_debt', name: 'Рост безнадежных долгов', currentValue: 0, scenarioValue: 15, unit: '%', min: 0, max: 50, step: 2 },
      { id: 'cost_cutting', name: 'Экстренное сокращение затрат', currentValue: 0, scenarioValue: -30, unit: '%', min: -60, max: 0, step: 5 },
      { id: 'inventory_writeoff', name: 'Списание запасов', currentValue: 0, scenarioValue: 10, unit: '%', min: 0, max: 30, step: 2 },
      { id: 'credit_line', name: 'Кредитная линия', currentValue: 0, scenarioValue: 2000000, unit: '₽', min: 0, max: 10000000, step: 100000 }
    ]
  },
  {
    id: 'expansion',
    name: 'Расширение бизнеса',
    description: 'Выход на новые рынки и запуск продуктов',
    icon: Zap,
    isActive: false,
    parameters: [
      { id: 'new_market', name: 'Новые рынки', currentValue: 0, scenarioValue: 40, unit: '%', min: 0, max: 200, step: 10 },
      { id: 'new_product', name: 'Новые продукты', currentValue: 0, scenarioValue: 25, unit: '%', min: 0, max: 100, step: 5 },
      { id: 'capex_investment', name: 'Инвестиции в оборудование', currentValue: 0, scenarioValue: 3000000, unit: '₽', min: 0, max: 20000000, step: 500000 },
      { id: 'staff_expansion', name: 'Расширение команды', currentValue: 0, scenarioValue: 35, unit: '%', min: 0, max: 100, step: 5 },
      { id: 'rd_investment', name: 'Инвестиции в R&D', currentValue: 0, scenarioValue: 50, unit: '%', min: 0, max: 200, step: 10 }
    ]
  }
];

export const Scenarios: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const [scenarios, setScenarios] = useState<Scenario[]>(defaultScenarios);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Базовые метрики из данных
  const baseMetrics = useMemo(() => {
    if (!state.dataFiles.sales) return null;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthRevenue = state.dataFiles.sales
      .filter(sale => sale.doc_date.startsWith(currentMonth))
      .reduce((sum, sale) => sum + sale.amount, 0);

    const monthCosts = (state.dataFiles.purchases || [])
      .filter(purchase => purchase.doc_date.startsWith(currentMonth))
      .reduce((sum, purchase) => sum + purchase.amount, 0);

    return {
      revenue: monthRevenue || 2000000,
      costs: monthCosts || 1500000,
      profit: (monthRevenue || 2000000) - (monthCosts || 1500000),
      margin: ((monthRevenue || 2000000) - (monthCosts || 1500000)) / (monthRevenue || 2000000) * 100
    };
  }, [state.dataFiles]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateScenarioResults = (scenario: Scenario): ScenarioResult[] => {
    if (!baseMetrics) return [];

    const results: ScenarioResult[] = [];
    let newRevenue = baseMetrics.revenue;
    let newCosts = baseMetrics.costs;

    // Применяем параметры сценария
    scenario.parameters.forEach(param => {
      const change = param.scenarioValue;
      
      switch (param.id) {
        case 'revenue_growth':
        case 'price_increase':
        case 'volume_increase':
        case 'new_market':
        case 'new_product':
          newRevenue *= (1 + change / 100);
          break;
        case 'revenue_decline':
          newRevenue *= (1 + change / 100);
          break;
        case 'opex_reduction':
        case 'cogs_optimization':
        case 'cost_cutting':
          newCosts *= (1 + change / 100);
          break;
        case 'marketing_spend':
        case 'staff_expansion':
        case 'rd_investment':
          newCosts *= (1 + Math.abs(change) / 100);
          break;
        case 'capex_investment':
          newCosts += change / 12; // Амортизация на месяц
          break;
        case 'credit_line':
          newCosts += change * 0.15 / 12; // 15% годовых
          break;
      }
    });

    const newProfit = newRevenue - newCosts;
    const newMargin = (newProfit / newRevenue) * 100;

    results.push(
      {
        metric: 'Выручка',
        current: baseMetrics.revenue,
        scenario: newRevenue,
        change: newRevenue - baseMetrics.revenue,
        changePercent: ((newRevenue - baseMetrics.revenue) / baseMetrics.revenue) * 100
      },
      {
        metric: 'Затраты',
        current: baseMetrics.costs,
        scenario: newCosts,
        change: newCosts - baseMetrics.costs,
        changePercent: ((newCosts - baseMetrics.costs) / baseMetrics.costs) * 100
      },
      {
        metric: 'Прибыль',
        current: baseMetrics.profit,
        scenario: newProfit,
        change: newProfit - baseMetrics.profit,
        changePercent: baseMetrics.profit !== 0 ? ((newProfit - baseMetrics.profit) / Math.abs(baseMetrics.profit)) * 100 : 0
      },
      {
        metric: 'Маржинальность',
        current: baseMetrics.margin,
        scenario: newMargin,
        change: newMargin - baseMetrics.margin,
        changePercent: ((newMargin - baseMetrics.margin) / baseMetrics.margin) * 100
      }
    );

    return results;
  };

  const updateParameter = (scenarioId: string, parameterId: string, value: number) => {
    setScenarios(prev => prev.map(scenario => 
      scenario.id === scenarioId 
        ? {
            ...scenario,
            parameters: scenario.parameters.map(param =>
              param.id === parameterId ? { ...param, scenarioValue: value } : param
            )
          }
        : scenario
    ));
  };

  const runScenario = (scenarioId: string) => {
    setActiveScenario(scenarioId);
    setIsRunning(true);
    setShowResults(false);
    
    // Имитация расчета
    setTimeout(() => {
      setIsRunning(false);
      setShowResults(true);
    }, 2000);
  };

  const resetScenario = (scenarioId: string) => {
    setScenarios(prev => prev.map(scenario => 
      scenario.id === scenarioId 
        ? {
            ...scenario,
            parameters: scenario.parameters.map(param => ({ ...param, scenarioValue: param.currentValue }))
          }
        : scenario
    ));
    
    if (activeScenario === scenarioId) {
      setActiveScenario(null);
      setShowResults(false);
    }
  };

  const exportScenario = () => {
    if (!activeScenario) return;
    
    const scenario = scenarios.find(s => s.id === activeScenario);
    if (!scenario) return;

    const results = calculateScenarioResults(scenario);
    const exportData = {
      scenarioName: scenario.name,
      parameters: scenario.parameters,
      results: results,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scenario_${scenario.id}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const activeScenarioData = activeScenario ? scenarios.find(s => s.id === activeScenario) : null;
  const scenarioResults = activeScenarioData ? calculateScenarioResults(activeScenarioData) : [];

  // Данные для графика
  const chartData = scenarioResults.map(result => ({
    metric: result.metric,
    current: result.current,
    scenario: result.scenario
  }));

  if (!baseMetrics) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Недостаточно данных для моделирования
            </h2>
            <p className="text-gray-600 mb-8">
              Загрузите данные продаж и закупок для работы со сценариями
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
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Target className="h-8 w-8 mr-3 text-primary-600" />
                  Сценарное моделирование
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Анализируйте различные бизнес-сценарии и их влияние на финансы
                </p>
              </div>
            </div>
            
            {showResults && (
              <div className="flex items-center space-x-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={exportScenario}
                  icon={Download}
                >
                  Экспорт
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Сценарии */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Бизнес-сценарии</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      activeScenario === scenario.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <scenario.icon className="h-5 w-5 text-primary-600 mr-2" />
                        <h3 className="font-medium text-gray-900">{scenario.name}</h3>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runScenario(scenario.id)}
                          disabled={isRunning}
                          icon={isRunning && activeScenario === scenario.id ? Pause : Play}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetScenario(scenario.id)}
                          icon={RotateCcw}
                        />
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
                    
                    <div className="space-y-3">
                      {scenario.parameters.map((param) => (
                        <div key={param.id}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {param.name}
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min={param.min}
                              max={param.max}
                              step={param.step}
                              value={param.scenarioValue}
                              onChange={(e) => updateParameter(scenario.id, param.id, Number(e.target.value))}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs text-gray-600 w-16 text-right">
                              {param.unit === '₽' ? formatCurrency(param.scenarioValue) : `${param.scenarioValue}${param.unit}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Результаты */}
          <div className="lg:col-span-2">
            {isRunning && (
              <Card className="mb-8">
                <CardContent className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Расчет сценария...
                  </h3>
                  <p className="text-gray-600">
                    Анализируем влияние параметров на финансовые показатели
                  </p>
                </CardContent>
              </Card>
            )}

            {showResults && activeScenarioData && (
              <>
                {/* Сводка результатов */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <activeScenarioData.icon className="h-5 w-5 mr-2" />
                      Результаты: {activeScenarioData.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {scenarioResults.map((result) => (
                        <div key={result.metric} className="text-center">
                          <p className="text-sm font-medium text-gray-500 mb-2">{result.metric}</p>
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-gray-900">
                              {result.metric === 'Маржинальность' 
                                ? `${result.scenario.toFixed(1)}%`
                                : formatCurrency(result.scenario)
                              }
                            </p>
                            <div className={`flex items-center justify-center text-sm ${
                              result.change >= 0 ? 'text-success-600' : 'text-danger-600'
                            }`}>
                              {result.change >= 0 ? (
                                <TrendingUp className="h-4 w-4 mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 mr-1" />
                              )}
                              {result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* График сравнения */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Сравнение: текущее состояние vs сценарий</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="metric" />
                          <YAxis 
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
                              typeof value === 'number' && value > 1000 
                                ? formatCurrency(value) 
                                : `${value}%`,
                              name === 'current' ? 'Текущее' : 'Сценарий'
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="current" fill="#6b7280" name="Текущее" />
                          <Bar dataKey="scenario" fill="#3b82f6" name="Сценарий" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Детальная таблица */}
                <Card>
                  <CardHeader>
                    <CardTitle>Детализация изменений</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Показатель
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Текущее
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Сценарий
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Изменение
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {scenarioResults.map((result) => (
                            <tr key={result.metric} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {result.metric}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {result.metric === 'Маржинальность' 
                                  ? `${result.current.toFixed(1)}%`
                                  : formatCurrency(result.current)
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {result.metric === 'Маржинальность' 
                                  ? `${result.scenario.toFixed(1)}%`
                                  : formatCurrency(result.scenario)
                                }
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                                result.change >= 0 ? 'text-success-600' : 'text-danger-600'
                              }`}>
                                {result.change >= 0 ? '+' : ''}
                                {result.metric === 'Маржинальность' 
                                  ? `${result.change.toFixed(1)}%`
                                  : formatCurrency(result.change)
                                }
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                                result.changePercent >= 0 ? 'text-success-600' : 'text-danger-600'
                              }`}>
                                {result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!activeScenario && !isRunning && (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Выберите сценарий для анализа
                  </h3>
                  <p className="text-gray-600">
                    Настройте параметры сценария и нажмите "Запустить" для расчета результатов
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
