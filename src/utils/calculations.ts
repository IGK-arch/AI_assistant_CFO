import { 
  SalesRecord, 
  PurchaseRecord, 
  ARAPRecord, 
  CashflowRecord, 
  PlanRecord,
  CFOAlert,
  AlertSeverity,
  ARAPMetrics,
  AgingBucket,
  PlanFactSeries,
  PlanFactPoint,
  AdvisorCalculation,
  AdvisorResult,
  FinancialInstrument
} from '../types';
import { format, differenceInDays, startOfMonth, endOfMonth, addDays } from 'date-fns';

// Утилиты для работы с датами
export const getCurrentDate = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const getMonthKey = (date: string): string => {
  return format(new Date(date), 'yyyy-MM');
};

export const getDaysInMonth = (period: string): number => {
  const date = new Date(period + '-01');
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return differenceInDays(end, start) + 1;
};

export const getDayOfMonth = (date: string): number => {
  return new Date(date).getDate();
};

// Расчет CFO дайджеста
export const calculateCFODigest = (
  sales: SalesRecord[],
  purchases: PurchaseRecord[],
  arAp: ARAPRecord[],
  cashflow: CashflowRecord[],
  plan: PlanRecord[]
): CFOAlert[] => {
  const alerts: CFOAlert[] = [];
  const today = getCurrentDate();
  const currentMonth = getMonthKey(today);

  // 1. Риск кассового разрыва в ближайшие 14 дней
  const cashflowRisk = calculateCashflowRisk(cashflow, today);
  if (cashflowRisk) {
    alerts.push(cashflowRisk);
  }

  // 2. Высокая просрочка AR
  const arOverdueAlert = calculateAROverdueAlert(arAp, today);
  if (arOverdueAlert) {
    alerts.push(arOverdueAlert);
  }

  // 3. Риск недовыполнения плана выручки
  const revenueRiskAlert = calculateRevenueRisk(sales, plan, today, currentMonth);
  if (revenueRiskAlert) {
    alerts.push(revenueRiskAlert);
  }

  // 4. Скачок OPEX
  const opexAlert = calculateOPEXAlert(purchases, today);
  if (opexAlert) {
    alerts.push(opexAlert);
  }

  // 5. Крупный платёж AP в 7 дней
  const largePaymentAlert = calculateLargePaymentAlert(arAp, sales, today);
  if (largePaymentAlert) {
    alerts.push(largePaymentAlert);
  }

  // Сортируем по важности и возвращаем топ-3
  const priorityOrder: { [key in AlertSeverity]: number } = {
    high: 4,
    medium: 3,
    low: 2,
    info: 1
  };

  return alerts
    .sort((a, b) => priorityOrder[b.severity] - priorityOrder[a.severity])
    .slice(0, 3);
};

// Расчет риска кассового разрыва
const calculateCashflowRisk = (cashflow: CashflowRecord[], today: string): CFOAlert | null => {
  const next14Days = Array.from({ length: 14 }, (_, i) => 
    format(addDays(new Date(today), i + 1), 'yyyy-MM-dd')
  );

  let cumulativeFlow = 0;
  for (const date of next14Days) {
    const dayFlow = cashflow
      .filter(cf => cf.date === date)
      .reduce((sum, cf) => sum + cf.amount, 0);
    
    cumulativeFlow += dayFlow;
    
    if (cumulativeFlow <= 0) {
      return {
        id: 'cashflow_risk',
        title: 'Риск кассового разрыва',
        severity: 'high',
        reason: `Прогнозируется отрицательный баланс ${format(new Date(date), 'dd.MM')}`,
        why_link: 'Недостаточный приток средств при текущих обязательствах',
        ctaRoute: '/plan-fact'
      };
    }
  }

  return null;
};

// Расчет алерта по просрочке AR
const calculateAROverdueAlert = (arAp: ARAPRecord[], today: string): CFOAlert | null => {
  const arRecords = arAp.filter(record => record.type === 'AR' && !record.paid_date);
  if (arRecords.length === 0) return null;

  const totalAR = arRecords.reduce((sum, record) => sum + record.amount, 0);
  const overdueAR = arRecords
    .filter(record => new Date(record.due_date) < new Date(today))
    .reduce((sum, record) => sum + record.amount, 0);

  const overduePercentage = (overdueAR / totalAR) * 100;

  if (overduePercentage > 20) {
    return {
      id: 'ar_overdue',
      title: 'Высокая просрочка дебиторки',
      severity: overduePercentage > 40 ? 'high' : 'medium',
      reason: `${overduePercentage.toFixed(1)}% дебиторки просрочено`,
      why_link: 'Высокий процент просроченной задолженности снижает ликвидность',
      ctaRoute: '/ar-ap'
    };
  }

  return null;
};

// Расчет риска по выручке
const calculateRevenueRisk = (
  sales: SalesRecord[],
  plan: PlanRecord[],
  today: string,
  currentMonth: string
): CFOAlert | null => {
  const monthPlan = plan.find(p => p.period === currentMonth && p.metric === 'Revenue');
  if (!monthPlan) return null;

  const monthSales = sales
    .filter(sale => getMonthKey(sale.doc_date) === currentMonth)
    .reduce((sum, sale) => sum + sale.amount, 0);

  const daysInMonth = getDaysInMonth(currentMonth);
  const daysPassed = getDayOfMonth(today);
  const expectedProgress = (daysPassed / daysInMonth) * 100;
  const actualProgress = (monthSales / monthPlan.amount) * 100;

  const deviation = expectedProgress - actualProgress;

  if (deviation > 10) {
    return {
      id: 'revenue_risk',
      title: 'Риск недовыполнения плана',
      severity: deviation > 20 ? 'high' : 'medium',
      reason: `Отставание от плана на ${deviation.toFixed(1)} п.п.`,
      why_link: 'Текущий темп продаж не позволит выполнить план месяца',
      ctaRoute: '/plan-fact'
    };
  }

  return null;
};

// Расчет алерта по OPEX
const calculateOPEXAlert = (purchases: PurchaseRecord[], today: string): CFOAlert | null => {
  const currentMonth = getMonthKey(today);
  const currentDate = new Date(today);
  
  // Получаем OPEX за последние 3 месяца
  const last3Months = Array.from({ length: 3 }, (_, i) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i - 1, 1);
    return format(date, 'yyyy-MM');
  });

  const monthlyOPEX = last3Months.map(month => {
    return purchases
      .filter(p => getMonthKey(p.doc_date) === month && p.expense_type === 'OPEX')
      .reduce((sum, p) => sum + p.amount, 0);
  });

  const currentMonthOPEX = purchases
    .filter(p => getMonthKey(p.doc_date) === currentMonth && p.expense_type === 'OPEX')
    .reduce((sum, p) => sum + p.amount, 0);

  const averageOPEX = monthlyOPEX.reduce((sum, opex) => sum + opex, 0) / 3;

  if (currentMonthOPEX > averageOPEX * 1.25) {
    return {
      id: 'opex_spike',
      title: 'Скачок операционных расходов',
      severity: currentMonthOPEX > averageOPEX * 1.5 ? 'high' : 'medium',
      reason: `OPEX превышает среднее в ${(currentMonthOPEX / averageOPEX).toFixed(1)} раз`,
      why_link: 'Резкий рост операционных расходов может сигнализировать о проблемах',
      ctaRoute: '/ar-ap'
    };
  }

  return null;
};

// Расчет алерта по крупным платежам
const calculateLargePaymentAlert = (
  arAp: ARAPRecord[],
  sales: SalesRecord[],
  today: string
): CFOAlert | null => {
  const next7Days = Array.from({ length: 7 }, (_, i) => 
    format(addDays(new Date(today), i + 1), 'yyyy-MM-dd')
  );

  // Средняя месячная выручка за последние 3 месяца
  const currentDate = new Date(today);
  const last3Months = Array.from({ length: 3 }, (_, i) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    return format(date, 'yyyy-MM');
  });

  const monthlyRevenues = last3Months.map(month => {
    return sales
      .filter(s => getMonthKey(s.doc_date) === month)
      .reduce((sum, s) => sum + s.amount, 0);
  });

  const avgMonthlyRevenue = monthlyRevenues.reduce((sum, rev) => sum + rev, 0) / 3;
  const threshold = avgMonthlyRevenue * 0.1; // 10% от средней месячной выручки

  const largePayments = arAp.filter(record => 
    record.type === 'AP' && 
    !record.paid_date &&
    next7Days.includes(record.due_date) &&
    record.amount > threshold
  );

  if (largePayments.length > 0) {
    const totalAmount = largePayments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      id: 'large_payment',
      title: 'Крупные платежи на неделе',
      severity: totalAmount > avgMonthlyRevenue * 0.2 ? 'high' : 'medium',
      reason: `Платежей на ${totalAmount.toLocaleString()} ₽ в ближайшие 7 дней`,
      why_link: 'Крупные исходящие платежи могут создать кассовый разрыв',
      ctaRoute: '/ar-ap'
    };
  }

  return null;
};

// Расчет метрик AR/AP
export const calculateARAPMetrics = (
  records: ARAPRecord[],
  type: 'AR' | 'AP',
  sales?: SalesRecord[]
): ARAPMetrics => {
  const filteredRecords = records.filter(r => r.type === type && !r.paid_date);
  const today = getCurrentDate();
  
  const totalAmount = filteredRecords.reduce((sum, r) => sum + r.amount, 0);
  
  // Расчет aging buckets
  const agingBuckets: AgingBucket[] = [
    { range: '0-30', amount: 0, count: 0, percentage: 0 },
    { range: '31-60', amount: 0, count: 0, percentage: 0 },
    { range: '61-90', amount: 0, count: 0, percentage: 0 },
    { range: '90+', amount: 0, count: 0, percentage: 0 }
  ];

  let overdueAmount = 0;

  filteredRecords.forEach(record => {
    const daysOverdue = differenceInDays(new Date(today), new Date(record.due_date));
    
    if (daysOverdue > 0) {
      overdueAmount += record.amount;
    }

    let bucketIndex = 0;
    if (daysOverdue > 90) bucketIndex = 3;
    else if (daysOverdue > 60) bucketIndex = 2;
    else if (daysOverdue > 30) bucketIndex = 1;

    agingBuckets[bucketIndex].amount += record.amount;
    agingBuckets[bucketIndex].count += 1;
  });

  // Рассчитываем проценты
  agingBuckets.forEach(bucket => {
    bucket.percentage = totalAmount > 0 ? (bucket.amount / totalAmount) * 100 : 0;
  });

  const overdueShare = totalAmount > 0 ? (overdueAmount / totalAmount) * 100 : 0;

  // Топ должников/кредиторов
  const topDebtors = filteredRecords
    .map(record => ({
      name: record.counterparty_name,
      amount: record.amount,
      days_overdue: Math.max(0, differenceInDays(new Date(today), new Date(record.due_date)))
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const result: ARAPMetrics = {
    overdue_share: overdueShare,
    total_amount: totalAmount,
    aging_buckets: agingBuckets,
    top_debtors: topDebtors
  };

  // DSO только для AR
  if (type === 'AR' && sales && sales.length > 0) {
    const last3MonthsRevenue = sales
      .filter(s => {
        const saleDate = new Date(s.doc_date);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return saleDate >= threeMonthsAgo;
      })
      .reduce((sum, s) => sum + s.amount, 0);

    if (last3MonthsRevenue > 0) {
      result.dso = (totalAmount / (last3MonthsRevenue / 3)) * 30; // DSO в днях
    }
  }

  return result;
};

// Расчет План-Факт-Прогноз
export const calculatePlanFactSeries = (
  sales: SalesRecord[],
  plan: PlanRecord[],
  metric: 'Revenue' | 'CF_IN' | 'CF_OUT' = 'Revenue'
): PlanFactSeries => {
  const currentDate = new Date();
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5 + i, 1);
    return format(date, 'yyyy-MM');
  });

  const planData: PlanFactPoint[] = [];
  const factData: PlanFactPoint[] = [];
  const forecastData: PlanFactPoint[] = [];

  last6Months.forEach(period => {
    const planRecord = plan.find(p => p.period === period && p.metric === metric);
    const planValue = planRecord ? planRecord.amount : 0;

    let factValue = 0;
    if (metric === 'Revenue') {
      factValue = sales
        .filter(s => getMonthKey(s.doc_date) === period)
        .reduce((sum, s) => sum + s.amount, 0);
    }

    planData.push({ x: period, y: planValue });
    factData.push({ x: period, y: factValue });
    
    // Простой прогноз на основе тренда последних 3 месяцев
    const forecastValue = calculateSimpleForecast(factData.slice(-3).map(p => p.y));
    forecastData.push({ x: period, y: forecastValue });
  });

  const insights = generateInsights(planData, factData, forecastData);

  return {
    plan: planData,
    fact: factData,
    forecast: forecastData,
    insights
  };
};

// Простой прогноз на основе линейного тренда
const calculateSimpleForecast = (values: number[]): number => {
  if (values.length < 2) return values[0] || 0;
  
  const n = values.length;
  const sumX = (n * (n + 1)) / 2; // 1 + 2 + ... + n
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = values.reduce((sum, val, i) => sum + val * (i + 1), 0);
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6; // 1² + 2² + ... + n²

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return slope * (n + 1) + intercept;
};

// Генерация инсайтов для План-Факт
const generateInsights = (
  plan: PlanFactPoint[],
  fact: PlanFactPoint[],
  forecast: PlanFactPoint[]
): string[] => {
  const insights: string[] = [];
  
  // Сравнение последнего месяца
  const lastPlan = plan[plan.length - 1];
  const lastFact = fact[fact.length - 1];
  
  if (lastPlan && lastFact && lastPlan.y > 0) {
    const deviation = ((lastFact.y - lastPlan.y) / lastPlan.y) * 100;
    
    if (Math.abs(deviation) > 10) {
      insights.push(
        deviation > 0 
          ? `Выручка превысила план на ${deviation.toFixed(1)}%`
          : `Выручка не выполнена на ${Math.abs(deviation).toFixed(1)}%`
      );
    }
  }

  // Тренд по факту
  const lastThreeMonths = fact.slice(-3).map(p => p.y);
  if (lastThreeMonths.length === 3) {
    const trend = (lastThreeMonths[2] - lastThreeMonths[0]) / 2;
    if (Math.abs(trend) > lastThreeMonths[1] * 0.1) {
      insights.push(
        trend > 0
          ? 'Положительный тренд роста выручки'
          : 'Наблюдается снижение выручки'
      );
    }
  }

  return insights;
};

// Расчеты для финансового эдвайзера
export const calculateAdvisorRecommendations = (
  instruments: FinancialInstrument[],
  amount: number,
  termMonths: number,
  goal: 'working_capital' | 'investment' | 'gap_closure'
): AdvisorResult => {
  const calculations: AdvisorCalculation[] = instruments.map(instrument => {
    const percentCost = amount * (instrument.rate_annual_percent / 100) * (termMonths / 12);
    const commissionsCost = amount * (instrument.commissions_percent / 100);
    const totalCost = percentCost + commissionsCost + instrument.other_costs_flat;
    const effectiveRate = (totalCost / amount) / (termMonths / 12) * 100;

    return {
      id: instrument.id,
      name: instrument.name,
      effectiveRate,
      totalCost,
      explanation: `Проценты: ${percentCost.toLocaleString()}₽, Комиссии: ${commissionsCost.toLocaleString()}₽, Прочее: ${instrument.other_costs_flat.toLocaleString()}₽`
    };
  });

  // Сортируем по эффективной ставке
  calculations.sort((a, b) => a.effectiveRate - b.effectiveRate);

  // Выбираем рекомендацию на основе цели
  let recommendedId = calculations[0].id;
  let recommendationReason = 'Минимальная эффективная стоимость капитала';

  if (goal === 'working_capital') {
    // Для оборотных средств предпочитаем факторинг или овердрафт
    const factoring = calculations.find(c => c.id.includes('factoring'));
    if (factoring) {
      recommendedId = factoring.id;
      recommendationReason = 'Оптимально для финансирования оборотного капитала';
    }
  } else if (goal === 'investment') {
    // Для инвестиций предпочитаем долгосрочные инструменты
    const longTerm = calculations.find(c => c.id.includes('loan') || c.id.includes('bonds'));
    if (longTerm && termMonths >= 12) {
      recommendedId = longTerm.id;
      recommendationReason = 'Подходит для долгосрочных инвестиционных проектов';
    }
  } else if (goal === 'gap_closure') {
    // Для закрытия разрыва предпочитаем быстрые инструменты
    const quickAccess = calculations.find(c => c.id.includes('factoring') || c.id.includes('overdraft'));
    if (quickAccess) {
      recommendedId = quickAccess.id;
      recommendationReason = 'Быстрое получение средств для закрытия кассового разрыва';
    }
  }

  return {
    items: calculations,
    recommendation: {
      id: recommendedId,
      why: recommendationReason
    }
  };
};
