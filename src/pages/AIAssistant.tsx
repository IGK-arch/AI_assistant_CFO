import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageCircle, 
  Send, 
  Bot, 
  User,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Lightbulb,
  FileText,
  Calculator
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../components/ui';
import { useAppState } from '../services/appState';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  query: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'cashflow-analysis',
    title: 'Анализ денежного потока',
    description: 'Проанализировать текущее состояние ДДС',
    icon: TrendingUp,
    query: 'Проанализируй мой денежный поток за последний месяц и дай рекомендации'
  },
  {
    id: 'risk-assessment',
    title: 'Оценка рисков',
    description: 'Выявить финансовые риски',
    icon: AlertTriangle,
    query: 'Какие финансовые риски я должен учесть в ближайшие 3 месяца?'
  },
  {
    id: 'profitability',
    title: 'Анализ прибыльности',
    description: 'Оценить рентабельность бизнеса',
    icon: DollarSign,
    query: 'Проанализируй рентабельность моего бизнеса и предложи способы её повышения'
  },
  {
    id: 'forecasting',
    title: 'Прогнозирование',
    description: 'Построить финансовые прогнозы',
    icon: BarChart3,
    query: 'Построй прогноз выручки на следующие 6 месяцев на основе текущих данных'
  },
  {
    id: 'optimization',
    title: 'Оптимизация затрат',
    description: 'Найти возможности экономии',
    icon: Lightbulb,
    query: 'Где я могу оптимизировать затраты без ущерба для бизнеса?'
  },
  {
    id: 'reporting',
    title: 'Финансовая отчетность',
    description: 'Помощь с отчетами',
    icon: FileText,
    query: 'Помоги подготовить финансовый отчет для инвесторов'
  }
];

export const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Приветственное сообщение
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: `Привет! Я ваш AI CFO-ассистент. Готов помочь с анализом финансов, прогнозированием и принятием решений.

Я могу:
• Анализировать ваши финансовые данные
• Выявлять риски и возможности  
• Давать рекомендации по оптимизации
• Строить прогнозы и сценарии
• Помогать с отчетностью

Выберите готовый вопрос ниже или задайте свой!`,
        timestamp: new Date(),
        suggestions: [
          'Покажи топ-3 проблемы в моих финансах',
          'Какая у меня ситуация с ликвидностью?',
          'Построй план действий на месяц'
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userQuery: string): string => {
    const query = userQuery.toLowerCase();
    
    // Анализ денежного потока
    if (query.includes('денежн') || query.includes('ддс') || query.includes('поток')) {
      return `На основе ваших данных анализирую денежный поток:

📊 **Текущая ситуация:**
• Средний месячный приток: ${formatCurrency(1850000)}
• Средний месячный отток: ${formatCurrency(1650000)}
• Чистый поток: ${formatCurrency(200000)} (положительный)

⚠️ **Выявленные риски:**
• 23% дебиторки просрочено - влияет на приток
• Крупные платежи поставщикам на следующей неделе
• Сезонное снижение продаж в ближайшие месяцы

💡 **Рекомендации:**
1. Усилить работу с просроченной дебиторкой
2. Пересмотреть условия оплаты с ключевыми клиентами
3. Создать резерв на сезонные колебания
4. Рассмотреть факторинг для улучшения ликвидности`;
    }

    // Анализ рисков
    if (query.includes('риск') || query.includes('проблем')) {
      return `🚨 **Топ-3 финансовых риска:**

**1. Риск ликвидности (ВЫСОКИЙ)**
• Просроченная дебиторка: 23% от общей суммы
• Предстоящие крупные платежи: ${formatCurrency(850000)}
• Рекомендация: Активизировать взыскание, рассмотреть кредитную линию

**2. Концентрационный риск (СРЕДНИЙ)**  
• 40% выручки от топ-3 клиентов
• Потеря крупного клиента критична
• Рекомендация: Диверсифицировать клиентскую базу

**3. Операционный риск (СРЕДНИЙ)**
• OPEX вырос на 15% за квартал
• Рентабельность снижается
• Рекомендация: Аудит затрат, оптимизация процессов

🛡️ **План минимизации рисков готов. Нужна детализация по какому-то пункту?**`;
    }

    // Анализ рентабельности
    if (query.includes('рентабель') || query.includes('прибыл') || query.includes('маржа')) {
      return `📈 **Анализ рентабельности:**

**Ключевые показатели:**
• Валовая маржа: 42% (норма для отрасли: 35-45%)
• EBITDA маржа: 18% (хороший показатель)
• Чистая маржа: 12% (выше среднего)

**Динамика (последние 3 месяца):**
• Выручка: рост на 8%
• Себестоимость: рост на 12% ⚠️
• OPEX: рост на 15% ⚠️

**Проблемные зоны:**
• Затраты растут быстрее выручки
• Снижение операционной эффективности

**Рекомендации для повышения рентабельности:**
1. Пересмотреть ценообразование (+5-7% к маржинальности)
2. Оптимизировать закупки (цель: -3% себестоимости)
3. Автоматизировать процессы (экономия OPEX: -8%)
4. Фокус на высокомаржинальные продукты/услуги

💰 **Потенциал роста чистой прибыли: +25-30%**`;
    }

    // Прогнозирование
    if (query.includes('прогноз') || query.includes('будущ') || query.includes('план')) {
      return `🔮 **Финансовый прогноз на 6 месяцев:**

**Прогноз выручки:**
• Базовый сценарий: ${formatCurrency(14500000)} (+12% к текущему периоду)
• Оптимистичный: ${formatCurrency(16200000)} (+25%)
• Пессимистичный: ${formatCurrency(12800000)} (-2%)

**Ключевые факторы прогноза:**
✅ Рост клиентской базы на 15%
✅ Запуск нового продукта в Q2
⚠️ Сезонное снижение в летние месяцы
⚠️ Возможное ухудшение экономики

**Рекомендуемые действия:**
1. **Март-Апрель:** Активные продажи перед сезонным спадом
2. **Май-Июль:** Фокус на удержание клиентов, оптимизация затрат
3. **Август-Сентябрь:** Подготовка к осеннему росту
4. **Октябрь+:** Масштабирование успешных инициатив

📊 **Хотите детальный план по месяцам или анализ конкретного сценария?**`;
    }

    // Оптимизация затрат
    if (query.includes('оптимиз') || query.includes('затрат') || query.includes('экономи')) {
      return `💡 **План оптимизации затрат:**

**Быстрые победы (1-2 месяца):**
• Пересмотр договоров с поставщиками: экономия ${formatCurrency(45000)}/мес
• Оптимизация офисных расходов: -${formatCurrency(15000)}/мес  
• Энергоэффективность: -${formatCurrency(8000)}/мес
• **Итого:** ${formatCurrency(68000)}/мес (${formatCurrency(816000)}/год)

**Средний срок (3-6 месяцев):**
• Автоматизация рутинных процессов: -0.5 FTE
• Пересмотр маркетинговых каналов: +30% ROI
• Оптимизация логистики: -${formatCurrency(25000)}/мес

**Долгосрочные инициативы (6+ месяцев):**
• Цифровизация документооборота
• Внедрение BI-системы для аналитики
• Пересмотр организационной структуры

⚡ **Общий потенциал экономии: ${formatCurrency(1200000)}/год**

🎯 **С чего начать? Рекомендую стартовать с пересмотра договоров - быстрый результат без рисков.**`;
    }

    // Общие вопросы
    if (query.includes('помоч') || query.includes('что дела')) {
      return `Конечно! Я готов помочь с любыми финансовыми вопросами:

🎯 **Популярные запросы:**
• "Проанализируй мою дебиторку"
• "Какие у меня самые затратные статьи?"
• "Построй план на квартал"
• "Оцени эффективность инвестиций"
• "Помоги с презентацией для инвесторов"

📊 **Могу работать с данными из разделов:**
• AR/AP - анализ задолженностей
• План-Факт - отклонения и прогнозы  
• Денежные потоки - ликвидность
• Сценарии - моделирование решений

Просто опишите, что вас интересует, и я дам детальный анализ с конкретными рекомендациями!`;
    }

    // Дефолтный ответ
    return `Понял ваш запрос! На основе загруженных данных могу проанализировать:

📈 **Доступные данные:**
${state.dataFiles.sales ? '✅ Данные продаж' : '❌ Данные продаж не загружены'}
${state.dataFiles.purchases ? '✅ Данные закупок' : '❌ Данные закупок не загружены'}  
${state.dataFiles.ar_ap ? '✅ AR/AP данные' : '❌ AR/AP данные не загружены'}
${state.dataFiles.cashflow ? '✅ Движение ДС' : '❌ Движение ДС не загружено'}
${state.dataFiles.plan ? '✅ Планы' : '❌ Планы не загружены'}

💡 **Рекомендую конкретизировать запрос:**
• "Проанализируй выручку за последний квартал"
• "Покажи проблемы с дебиторкой"  
• "Какие риски в денежном потоке?"
• "Построй прогноз на 3 месяца"

Что именно вас интересует?`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Имитируем задержку ответа AI
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAIResponse(inputValue),
        timestamp: new Date(),
        suggestions: [
          'Дай более детальный анализ',
          'Покажи конкретные цифры',
          'Что делать дальше?'
        ]
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (action: QuickAction) => {
    setInputValue(action.query);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
                  <Bot className="h-8 w-8 mr-3 text-primary-600" />
                  AI CFO Ассистент
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Умный помощник для финансового анализа и принятия решений
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Быстрые действия */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Быстрые вопросы
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-start">
                      <action.icon className="h-5 w-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {action.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Чат */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Чат с AI ассистентом
                </CardTitle>
              </CardHeader>
              
              {/* Сообщения */}
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-3xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                        <div className="flex items-start space-x-3">
                          {message.type === 'assistant' && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                          
                          <div className={`
                            rounded-lg px-4 py-3 max-w-full
                            ${message.type === 'user' 
                              ? 'bg-primary-600 text-white ml-12' 
                              : 'bg-gray-100 text-gray-900'
                            }
                          `}>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {message.content}
                            </div>
                            
                            {message.suggestions && message.type === 'assistant' && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-600 mb-2">Попробуйте спросить:</p>
                                <div className="space-y-1">
                                  {message.suggestions.map((suggestion, index) => (
                                    <button
                                      key={index}
                                      onClick={() => handleSuggestion(suggestion)}
                                      className="block w-full text-left text-xs text-primary-600 hover:text-primary-700 py-1"
                                    >
                                      • {suggestion}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {message.type === 'user' && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className={`text-xs text-gray-500 mt-1 ${
                          message.type === 'user' ? 'text-right mr-11' : 'ml-11'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-4 py-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </CardContent>
              
              {/* Поле ввода */}
              <div className="flex-shrink-0 p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Задайте вопрос о ваших финансах..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    icon={Send}
                  >
                    Отправить
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
