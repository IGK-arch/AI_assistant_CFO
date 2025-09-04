import Papa from 'papaparse';
import { SalesRecord, PurchaseRecord, ARAPRecord, CashflowRecord, PlanRecord } from '../types';

export interface ParseResult<T> {
  data: T[];
  errors: string[];
  warnings: string[];
}

// Утилиты для валидации и преобразования данных
export const parseDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Попытка парсинга различных форматов даты
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\.\d{2}\.\d{4}$/, // DD.MM.YYYY
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
  ];
  
  if (formats[0].test(dateStr)) {
    return dateStr; // Уже в нужном формате
  }
  
  if (formats[1].test(dateStr)) {
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  if (formats[2].test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Если не удалось распарсить, возвращаем как есть
  return dateStr;
};

export const parseNumber = (numStr: string): number => {
  if (!numStr) return 0;
  
  // Заменяем запятые на точки и убираем пробелы
  const cleaned = numStr.toString().replace(/,/g, '.').replace(/\s+/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? 0 : num;
};

// Парсер для sales.csv
export const parseSalesCSV = (csvContent: string): ParseResult<SalesRecord> => {
  const result: ParseResult<SalesRecord> = {
    data: [],
    errors: [],
    warnings: []
  };

  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parseResult.errors.length > 0) {
    result.errors = parseResult.errors.map(err => err.message);
    return result;
  }

  const requiredFields = ['doc_id', 'doc_date', 'counterparty_name', 'amount'];
  
  parseResult.data.forEach((row: any, index: number) => {
    try {
      // Проверяем обязательные поля
      const missingFields = requiredFields.filter(field => !row[field]);
      if (missingFields.length > 0) {
        result.warnings.push(`Строка ${index + 1}: отсутствуют поля ${missingFields.join(', ')}`);
        return;
      }

      const qty = parseNumber(row.qty || '1');
      const price = parseNumber(row.price || '0');
      const vat = parseNumber(row.vat || '0');
      let amount = parseNumber(row.amount || '0');

      // Если amount пустой, вычисляем его
      if (!amount && qty && price) {
        amount = qty * price + vat;
        result.warnings.push(`Строка ${index + 1}: amount вычислен автоматически`);
      }

      const record: SalesRecord = {
        doc_id: row.doc_id,
        doc_date: parseDate(row.doc_date),
        counterparty_name: row.counterparty_name,
        sku: row.sku || '',
        qty,
        price,
        vat,
        amount,
        currency: row.currency || 'RUB',
        project_id: row.project_id || undefined,
        paid_date: row.paid_date ? parseDate(row.paid_date) : undefined
      };

      result.data.push(record);
    } catch (error) {
      result.errors.push(`Ошибка в строке ${index + 1}: ${error}`);
    }
  });

  return result;
};

// Парсер для purchases.csv
export const parsePurchasesCSV = (csvContent: string): ParseResult<PurchaseRecord> => {
  const result: ParseResult<PurchaseRecord> = {
    data: [],
    errors: [],
    warnings: []
  };

  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parseResult.errors.length > 0) {
    result.errors = parseResult.errors.map(err => err.message);
    return result;
  }

  const requiredFields = ['doc_id', 'doc_date', 'supplier_name', 'amount'];
  
  parseResult.data.forEach((row: any, index: number) => {
    try {
      const missingFields = requiredFields.filter(field => !row[field]);
      if (missingFields.length > 0) {
        result.warnings.push(`Строка ${index + 1}: отсутствуют поля ${missingFields.join(', ')}`);
        return;
      }

      const qty = parseNumber(row.qty || '1');
      const price = parseNumber(row.price || '0');
      const vat = parseNumber(row.vat || '0');
      let amount = parseNumber(row.amount || '0');

      if (!amount && qty && price) {
        amount = qty * price + vat;
        result.warnings.push(`Строка ${index + 1}: amount вычислен автоматически`);
      }

      const record: PurchaseRecord = {
        doc_id: row.doc_id,
        doc_date: parseDate(row.doc_date),
        supplier_name: row.supplier_name,
        sku: row.sku || '',
        qty,
        price,
        vat,
        amount,
        currency: row.currency || 'RUB',
        project_id: row.project_id || undefined,
        paid_date: row.paid_date ? parseDate(row.paid_date) : undefined,
        expense_type: row.expense_type === 'COGS' ? 'COGS' : 'OPEX'
      };

      result.data.push(record);
    } catch (error) {
      result.errors.push(`Ошибка в строке ${index + 1}: ${error}`);
    }
  });

  return result;
};

// Парсер для ar_ap.csv
export const parseARAPCSV = (csvContent: string): ParseResult<ARAPRecord> => {
  const result: ParseResult<ARAPRecord> = {
    data: [],
    errors: [],
    warnings: []
  };

  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parseResult.errors.length > 0) {
    result.errors = parseResult.errors.map(err => err.message);
    return result;
  }

  const requiredFields = ['type', 'doc_id', 'doc_date', 'counterparty_name', 'amount'];
  
  parseResult.data.forEach((row: any, index: number) => {
    try {
      const missingFields = requiredFields.filter(field => !row[field]);
      if (missingFields.length > 0) {
        result.warnings.push(`Строка ${index + 1}: отсутствуют поля ${missingFields.join(', ')}`);
        return;
      }

      if (!['AR', 'AP'].includes(row.type)) {
        result.warnings.push(`Строка ${index + 1}: неверный тип ${row.type}, должен быть AR или AP`);
        return;
      }

      let dueDate = row.due_date;
      if (!dueDate) {
        // Если due_date пуст, считаем doc_date + 30 дней
        const docDate = new Date(parseDate(row.doc_date));
        docDate.setDate(docDate.getDate() + 30);
        dueDate = docDate.toISOString().split('T')[0];
        result.warnings.push(`Строка ${index + 1}: due_date установлен автоматически (+30 дней)`);
      }

      const record: ARAPRecord = {
        type: row.type as 'AR' | 'AP',
        doc_id: row.doc_id,
        doc_date: parseDate(row.doc_date),
        counterparty_name: row.counterparty_name,
        amount: parseNumber(row.amount),
        currency: row.currency || 'RUB',
        due_date: parseDate(dueDate),
        paid_date: row.paid_date ? parseDate(row.paid_date) : undefined
      };

      result.data.push(record);
    } catch (error) {
      result.errors.push(`Ошибка в строке ${index + 1}: ${error}`);
    }
  });

  return result;
};

// Парсер для cashflow.csv
export const parseCashflowCSV = (csvContent: string): ParseResult<CashflowRecord> => {
  const result: ParseResult<CashflowRecord> = {
    data: [],
    errors: [],
    warnings: []
  };

  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parseResult.errors.length > 0) {
    result.errors = parseResult.errors.map(err => err.message);
    return result;
  }

  const requiredFields = ['date', 'category', 'amount'];
  
  parseResult.data.forEach((row: any, index: number) => {
    try {
      const missingFields = requiredFields.filter(field => !row[field]);
      if (missingFields.length > 0) {
        result.warnings.push(`Строка ${index + 1}: отсутствуют поля ${missingFields.join(', ')}`);
        return;
      }

      const record: CashflowRecord = {
        date: parseDate(row.date),
        category: row.category,
        subcat: row.subcat || '',
        amount: parseNumber(row.amount),
        currency: row.currency || 'RUB'
      };

      result.data.push(record);
    } catch (error) {
      result.errors.push(`Ошибка в строке ${index + 1}: ${error}`);
    }
  });

  return result;
};

// Парсер для plan.csv
export const parsePlanCSV = (csvContent: string): ParseResult<PlanRecord> => {
  const result: ParseResult<PlanRecord> = {
    data: [],
    errors: [],
    warnings: []
  };

  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parseResult.errors.length > 0) {
    result.errors = parseResult.errors.map(err => err.message);
    return result;
  }

  const requiredFields = ['period', 'metric', 'amount'];
  const validMetrics = ['Revenue', 'CF_IN', 'CF_OUT'];
  
  parseResult.data.forEach((row: any, index: number) => {
    try {
      const missingFields = requiredFields.filter(field => !row[field]);
      if (missingFields.length > 0) {
        result.warnings.push(`Строка ${index + 1}: отсутствуют поля ${missingFields.join(', ')}`);
        return;
      }

      if (!validMetrics.includes(row.metric)) {
        result.warnings.push(`Строка ${index + 1}: неверная метрика ${row.metric}`);
        return;
      }

      const record: PlanRecord = {
        period: row.period,
        metric: row.metric as 'Revenue' | 'CF_IN' | 'CF_OUT',
        amount: parseNumber(row.amount),
        currency: row.currency || 'RUB'
      };

      result.data.push(record);
    } catch (error) {
      result.errors.push(`Ошибка в строке ${index + 1}: ${error}`);
    }
  });

  return result;
};

// Универсальная функция для экспорта в CSV
export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
