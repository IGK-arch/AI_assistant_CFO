import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Mail, 
  Filter,
  Search,
  Calendar,
  Users,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '../components/ui';
import { useAppState } from '../services/appState';
import { calculateARAPMetrics } from '../utils/calculations';
import { generateEmailDraft } from '../utils/emailTemplates';
import { exportToCSV } from '../utils/csvParser';
import { differenceInDays } from 'date-fns';

type TabType = 'AR' | 'AP';

export const ARAPCenter: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  
  const [activeTab, setActiveTab] = useState<TabType>('AR');
  const [searchTerm, setSearchTerm] = useState('');
  const [agingFilter, setAgingFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Получаем данные AR/AP
  const arApData = useMemo(() => {
    return state.dataFiles.ar_ap || [];
  }, [state.dataFiles.ar_ap]);

  // Вычисляем метрики
  const metrics = useMemo(() => {
    return calculateARAPMetrics(arApData, activeTab, state.dataFiles.sales);
  }, [arApData, activeTab, state.dataFiles.sales]);

  // Фильтруем данные
  const filteredData = useMemo(() => {
    let data = arApData.filter(record => 
      record.type === activeTab && 
      !record.paid_date &&
      record.counterparty_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Фильтр по просрочке
    if (agingFilter !== 'all') {
      const today = new Date();
      data = data.filter(record => {
        const daysOverdue = differenceInDays(today, new Date(record.due_date));
        
        switch (agingFilter) {
          case '0-30':
            return daysOverdue >= 0 && daysOverdue <= 30;
          case '31-60':
            return daysOverdue > 30 && daysOverdue <= 60;
          case '61-90':
            return daysOverdue > 60 && daysOverdue <= 90;
          case '90+':
            return daysOverdue > 90;
          case 'overdue':
            return daysOverdue > 0;
          default:
            return true;
        }
      });
    }

    return data.sort((a, b) => b.amount - a.amount); // Сортируем по убыванию суммы
  }, [arApData, activeTab, searchTerm, agingFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.max(0, differenceInDays(today, due));
  };

  const getOverdueStatus = (daysOverdue: number) => {
    if (daysOverdue === 0) return { text: 'В срок', color: 'text-gray-600' };
    if (daysOverdue <= 30) return { text: `${daysOverdue} дн.`, color: 'text-warning-600' };
    if (daysOverdue <= 60) return { text: `${daysOverdue} дн.`, color: 'text-danger-600' };
    return { text: `${daysOverdue} дн.`, color: 'text-danger-800 font-semibold' };
  };

  const handleSelectItem = (docId: string) => {
    setSelectedItems(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData.map(item => item.doc_id));
    }
  };

  const handleGenerateEmail = (record: any) => {
    const daysOverdue = getDaysOverdue(record.due_date);
    const draft = generateEmailDraft(
      record.counterparty_name,
      record.doc_id,
      record.doc_date,
      record.amount,
      record.due_date,
      daysOverdue
    );

    // В реальном приложении здесь был бы модал с редактором письма
    alert(`Черновик письма для ${draft.to}:\n\nТема: ${draft.subject}\n\n${draft.body}`);
  };

  const handleExport = () => {
    const dataToExport = filteredData.map(record => ({
      ...record,
      days_overdue: getDaysOverdue(record.due_date)
    }));
    
    exportToCSV(dataToExport, `${activeTab.toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (!arApData.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              AR/AP данные не найдены
            </h2>
            <p className="text-gray-600 mb-8">
              Загрузите файл ar_ap.csv или данные продаж для анализа задолженностей
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
                  AR/AP Центр
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Управление дебиторской и кредиторской задолженностью
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExport}
                icon={Download}
              >
                Экспорт
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Вкладки */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('AR')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'AR'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Дебиторская задолженность (AR)
              </button>
              <button
                onClick={() => setActiveTab('AP')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'AP'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Кредиторская задолженность (AP)
              </button>
            </nav>
          </div>
        </div>

        {/* Метрики */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingDown className="h-8 w-8 text-primary-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Общая сумма
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics.total_amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-warning-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Доля просрочки
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.overdue_share.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {activeTab === 'AR' && metrics.dso && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-success-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      DSO (дни)
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(metrics.dso)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-gray-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Количество
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredData.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Фильтры */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Поиск по контрагенту..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
              
              <Select
                value={agingFilter}
                onChange={(e) => setAgingFilter(e.target.value)}
              >
                <option value="all">Все периоды</option>
                <option value="0-30">0-30 дней</option>
                <option value="31-60">31-60 дней</option>
                <option value="61-90">61-90 дней</option>
                <option value="90+">90+ дней</option>
                <option value="overdue">Только просрочка</option>
              </Select>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Выбрано: {selectedItems.length}
                </span>
                {activeTab === 'AR' && selectedItems.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Mail}
                    onClick={() => {
                      // Массовая генерация писем
                      selectedItems.forEach(docId => {
                        const record = filteredData.find(r => r.doc_id === docId);
                        if (record) handleGenerateEmail(record);
                      });
                    }}
                  >
                    Письма
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Таблица */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === filteredData.length && filteredData.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Документ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Контрагент
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Срок оплаты
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Просрочка
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((record) => {
                    const daysOverdue = getDaysOverdue(record.due_date);
                    const overdueStatus = getOverdueStatus(daysOverdue);
                    
                    return (
                      <tr key={record.doc_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(record.doc_id)}
                            onChange={() => handleSelectItem(record.doc_id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.doc_id}
                            </div>
                            <div className="text-sm text-gray-500">
                              от {formatDate(record.doc_date)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {record.counterparty_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(record.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(record.due_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${overdueStatus.color}`}>
                            {overdueStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {activeTab === 'AR' && daysOverdue > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateEmail(record)}
                              icon={Mail}
                            >
                              Письмо
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredData.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    Данные не найдены
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
