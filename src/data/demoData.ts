import { 
  SalesRecord, 
  PurchaseRecord, 
  ARAPRecord, 
  CashflowRecord, 
  PlanRecord, 
  AdvisorConfig 
} from '../types';
import { format, subDays, addDays } from 'date-fns';

// Утилита для генерации случайных данных
const getRandomDate = (daysBack: number, daysForward: number = 0): string => {
  const today = new Date();
  const randomDays = Math.floor(Math.random() * (daysBack + daysForward + 1)) - daysBack;
  return format(addDays(today, randomDays), 'yyyy-MM-dd');
};

const getRandomAmount = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Демо данные продаж
export const demoSalesData: SalesRecord[] = [
  // Последние 90 дней продаж
  ...Array.from({ length: 800 }, (_, i) => {
    const counterparties = [
      'ООО "Рога и Копыта"',
      'ИП Иванов И.И.',
      'ООО "Ромашка"',
      'АО "Большая Компания"',
      'ООО "МелкОпт"',
      'ИП Петров П.П.'
    ];
    
    const products = [
      'Товар А',
      'Товар Б',
      'Услуга В',
      'Товар Г',
      'Услуга Д'
    ];

    const docDate = getRandomDate(90, 0);
    const qty = getRandomAmount(1, 50);
    const price = getRandomAmount(1000, 50000);
    const vat = Math.floor(price * qty * 0.2); // НДС 20%
    const amount = qty * price + vat;
    
    // 70% продаж уже оплачены
    const paidDate = Math.random() < 0.7 ? getRandomDate(0, 30) : undefined;

    return {
      doc_id: `S-2024-${String(i + 1).padStart(4, '0')}`,
      doc_date: docDate,
      counterparty_name: getRandomElement(counterparties),
      sku: getRandomElement(products),
      qty,
      price,
      vat,
      amount,
      currency: 'RUB',
      project_id: Math.random() < 0.3 ? `PRJ-${getRandomAmount(1, 10)}` : undefined,
      paid_date: paidDate
    };
  })
];

// Демо данные закупок
export const demoPurchasesData: PurchaseRecord[] = [
  ...Array.from({ length: 500 }, (_, i) => {
    const suppliers = [
      'ООО "Поставщик 1"',
      'ИП Сидоров С.С.',
      'ООО "Снабжение"',
      'АО "Материалы"',
      'ООО "Офис-Трейд"'
    ];
    
    const products = [
      'Материал X',
      'Канцтовары',
      'Аренда офиса',
      'Интернет',
      'Материал Y',
      'Реклама'
    ];

    const docDate = getRandomDate(90, 0);
    const qty = getRandomAmount(1, 20);
    const price = getRandomAmount(500, 25000);
    const vat = Math.floor(price * qty * 0.2);
    const amount = qty * price + vat;
    
    // 60% закупок уже оплачены
    const paidDate = Math.random() < 0.6 ? getRandomDate(0, 45) : undefined;
    
    const expenseType = getRandomElement(['COGS', 'COGS', 'OPEX']) as 'COGS' | 'OPEX'; // 66% COGS

    return {
      doc_id: `P-2024-${String(i + 1).padStart(4, '0')}`,
      doc_date: docDate,
      supplier_name: getRandomElement(suppliers),
      sku: getRandomElement(products),
      qty,
      price,
      vat,
      amount,
      currency: 'RUB',
      project_id: Math.random() < 0.2 ? `PRJ-${getRandomAmount(1, 10)}` : undefined,
      paid_date: paidDate,
      expense_type: expenseType
    };
  })
];

// Демо данные AR/AP (альтернативный формат)
export const demoARAPData: ARAPRecord[] = [
  // Дебиторская задолженность
  ...Array.from({ length: 50 }, (_, i) => {
    const counterparties = [
      'ООО "Должник 1"',
      'ИП Неплатежев Н.Н.',
      'ООО "Проблемный Клиент"',
      'АО "Медленные Платежи"',
      'ООО "Кризис-Трейд"'
    ];

    const docDate = getRandomDate(120, 0);
    const dueDate = getRandomDate(30, 60); // Срок оплаты от -30 до +60 дней от сегодня
    const amount = getRandomAmount(10000, 500000);
    
    // 30% AR просрочены и не оплачены
    const isPaid = Math.random() < 0.7;
    const paidDate = isPaid ? getRandomDate(0, 30) : undefined;

    return {
      type: 'AR' as const,
      doc_id: `AR-2024-${String(i + 1).padStart(3, '0')}`,
      doc_date: docDate,
      counterparty_name: getRandomElement(counterparties),
      amount,
      currency: 'RUB',
      due_date: dueDate,
      paid_date: paidDate
    };
  }),
  
  // Кредиторская задолженность
  ...Array.from({ length: 40 }, (_, i) => {
    const suppliers = [
      'ООО "Важный Поставщик"',
      'АО "Стратегический Партнер"',
      'ООО "Срочные Платежи"',
      'ИП Кредиторов К.К.',
      'ООО "Неотложка"'
    ];

    const docDate = getRandomDate(60, 0);
    const dueDate = getRandomDate(-10, 30); // Некоторые уже просрочены
    const amount = getRandomAmount(15000, 800000);
    
    // 80% AP еще не оплачены
    const isPaid = Math.random() < 0.2;
    const paidDate = isPaid ? getRandomDate(0, 15) : undefined;

    return {
      type: 'AP' as const,
      doc_id: `AP-2024-${String(i + 1).padStart(3, '0')}`,
      doc_date: docDate,
      counterparty_name: getRandomElement(suppliers),
      amount,
      currency: 'RUB',
      due_date: dueDate,
      paid_date: paidDate
    };
  })
];

// Демо данные движения денежных средств
export const demoCashflowData: CashflowRecord[] = [
  ...Array.from({ length: 120 }, (_, i) => {
    const categories = [
      { name: 'Продажи', subcat: 'Оплата от клиентов', amount: () => getRandomAmount(50000, 300000) },
      { name: 'Закупки', subcat: 'Оплата поставщикам', amount: () => -getRandomAmount(30000, 200000) },
      { name: 'Зарплата', subcat: 'Заработная плата', amount: () => -getRandomAmount(80000, 150000) },
      { name: 'Налоги', subcat: 'НДС', amount: () => -getRandomAmount(20000, 100000) },
      { name: 'Операционные', subcat: 'Аренда офиса', amount: () => -getRandomAmount(40000, 80000) },
      { name: 'Операционные', subcat: 'Коммунальные', amount: () => -getRandomAmount(5000, 15000) },
      { name: 'Прочие', subcat: 'Банковские комиссии', amount: () => -getRandomAmount(1000, 5000) }
    ];

    const category = getRandomElement(categories);
    
    return {
      date: getRandomDate(60, 0),
      category: category.name,
      subcat: category.subcat,
      amount: category.amount(),
      currency: 'RUB'
    };
  })
];

// Демо данные планов
export const demoPlanData: PlanRecord[] = [
  // Планы на 12 месяцев
  ...Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6 + i);
    const period = format(date, 'yyyy-MM');
    
    const baseRevenue = 2000000 + (i * 100000); // Рост планов
    const baseCFIn = baseRevenue * 1.1; // Приток больше выручки
    const baseCFOut = baseRevenue * 0.8; // Отток меньше выручки

    return [
      {
        period,
        metric: 'Revenue' as const,
        amount: baseRevenue + getRandomAmount(-200000, 200000),
        currency: 'RUB'
      },
      {
        period,
        metric: 'CF_IN' as const,
        amount: baseCFIn + getRandomAmount(-100000, 100000),
        currency: 'RUB'
      },
      {
        period,
        metric: 'CF_OUT' as const,
        amount: baseCFOut + getRandomAmount(-100000, 100000),
        currency: 'RUB'
      }
    ];
  }).flat()
];

// Демо конфигурация финансового эдвайзера
export const demoAdvisorConfig: AdvisorConfig = {
  instruments: [
    {
      id: 'bank_loan',
      name: 'Банковский кредит',
      rate_annual_percent: 14,
      commissions_percent: 1.2,
      other_costs_flat: 0,
      repayment: 'annuity'
    },
    {
      id: 'factoring',
      name: 'Факторинг',
      rate_annual_percent: 12,
      commissions_percent: 0.8,
      other_costs_flat: 0,
      repayment: 'bullet'
    },
    {
      id: 'bonds',
      name: 'Облигации (МСП)',
      rate_annual_percent: 10,
      commissions_percent: 1.5,
      other_costs_flat: 200000,
      repayment: 'coupon_only'
    },
    {
      id: 'overdraft',
      name: 'Овердрафт',
      rate_annual_percent: 16,
      commissions_percent: 0.5,
      other_costs_flat: 15000,
      repayment: 'bullet'
    },
    {
      id: 'trade_finance',
      name: 'Торговое финансирование',
      rate_annual_percent: 13,
      commissions_percent: 1.0,
      other_costs_flat: 25000,
      repayment: 'bullet'
    }
  ]
};

// Функция для получения всех демо-данных
export const getAllDemoData = () => {
  return {
    sales: demoSalesData,
    purchases: demoPurchasesData,
    ar_ap: demoARAPData,
    cashflow: demoCashflowData,
    plan: demoPlanData,
    advisor: demoAdvisorConfig
  };
};

// Функция для генерации CSV контента из демо-данных
export const generateDemoCSV = (dataType: 'sales' | 'purchases' | 'ar_ap' | 'cashflow' | 'plan') => {
  let data: any[] = [];
  
  switch (dataType) {
    case 'sales':
      data = demoSalesData.slice(0, 100); // Ограничиваем для демо
      break;
    case 'purchases':
      data = demoPurchasesData.slice(0, 80);
      break;
    case 'ar_ap':
      data = demoARAPData.slice(0, 50);
      break;
    case 'cashflow':
      data = demoCashflowData.slice(0, 60);
      break;
    case 'plan':
      data = demoPlanData;
      break;
  }
  
  if (data.length === 0) return '';
  
  // Получаем заголовки из первого объекта
  const headers = Object.keys(data[0]);
  
  // Создаем CSV строки
  const csvRows = [
    headers.join(','), // Заголовки
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Экранируем значения с запятыми или кавычками
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
};
