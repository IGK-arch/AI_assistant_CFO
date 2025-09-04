import React from 'react';
import { AppState, UserProfile } from '../types';

const STORAGE_KEY = 'ai_cfo_assistant_state';

// Начальное состояние
const initialState: AppState = {
  profile: null,
  dataFiles: {},
  filters: {
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  isLoading: false
};

// Класс для управления состоянием приложения
class AppStateManager {
  private state: AppState = initialState;
  private listeners: ((state: AppState) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  // Получить текущее состояние
  getState(): AppState {
    return { ...this.state };
  }

  // Подписаться на изменения состояния
  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.push(listener);
    
    // Возвращаем функцию для отписки
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Обновить состояние
  setState(updater: (prevState: AppState) => AppState): void {
    const newState = updater(this.state);
    this.state = newState;
    this.saveToStorage();
    this.notifyListeners();
  }

  // Обновить профиль пользователя
  updateProfile(profile: UserProfile): void {
    this.setState(prevState => ({
      ...prevState,
      profile
    }));
  }

  // Обновить данные файлов
  updateDataFiles(dataFiles: Partial<AppState['dataFiles']>): void {
    this.setState(prevState => ({
      ...prevState,
      dataFiles: {
        ...prevState.dataFiles,
        ...dataFiles
      }
    }));
  }

  // Обновить фильтры
  updateFilters(filters: Partial<AppState['filters']>): void {
    this.setState(prevState => ({
      ...prevState,
      filters: {
        ...prevState.filters,
        ...filters
      }
    }));
  }

  // Установить состояние загрузки
  setLoading(isLoading: boolean): void {
    this.setState(prevState => ({
      ...prevState,
      isLoading
    }));
  }

  // Установить ошибку
  setError(error: string | undefined): void {
    this.setState(prevState => ({
      ...prevState,
      error
    }));
  }

  // Очистить все данные
  clearData(): void {
    this.state = initialState;
    this.saveToStorage();
    this.notifyListeners();
  }

  // Проверить, есть ли загруженные данные
  hasData(): boolean {
    const { dataFiles } = this.state;
    return !!(
      dataFiles.sales?.length ||
      dataFiles.purchases?.length ||
      dataFiles.ar_ap?.length ||
      dataFiles.cashflow?.length ||
      dataFiles.plan?.length ||
      dataFiles.advisor
    );
  }

  // Проверить готовность для конкретного модуля
  isModuleReady(module: 'dashboard' | 'ar-ap' | 'plan-fact' | 'advisor'): boolean {
    const { dataFiles } = this.state;
    
    switch (module) {
      case 'dashboard':
        return !!(dataFiles.sales?.length || dataFiles.ar_ap?.length);
      
      case 'ar-ap':
        return !!(dataFiles.ar_ap?.length || dataFiles.sales?.length);
      
      case 'plan-fact':
        return !!(dataFiles.sales?.length && dataFiles.plan?.length);
      
      case 'advisor':
        return !!dataFiles.advisor;
      
      default:
        return false;
    }
  }

  // Сохранить в localStorage
  private saveToStorage(): void {
    try {
      const stateToSave = {
        ...this.state,
        // Не сохраняем состояния загрузки и ошибки
        isLoading: false,
        error: undefined
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Не удалось сохранить состояние в localStorage:', error);
    }
  }

  // Загрузить из localStorage
  private loadFromStorage(): void {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Валидируем загруженное состояние
        if (this.isValidState(parsedState)) {
          this.state = {
            ...initialState,
            ...parsedState,
            isLoading: false,
            error: undefined
          };
        }
      }
    } catch (error) {
      console.warn('Не удалось загрузить состояние из localStorage:', error);
      this.state = initialState;
    }
  }

  // Валидация состояния
  private isValidState(state: any): boolean {
    return (
      state &&
      typeof state === 'object' &&
      typeof state.filters === 'object' &&
      typeof state.dataFiles === 'object'
    );
  }

  // Уведомить слушателей об изменениях
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('Ошибка в слушателе состояния:', error);
      }
    });
  }

  // Экспорт текущего состояния
  exportState(): string {
    return JSON.stringify(this.getState(), null, 2);
  }

  // Импорт состояния
  importState(stateJson: string): boolean {
    try {
      const newState = JSON.parse(stateJson);
      if (this.isValidState(newState)) {
        this.state = {
          ...initialState,
          ...newState,
          isLoading: false,
          error: undefined
        };
        this.saveToStorage();
        this.notifyListeners();
        return true;
      }
    } catch (error) {
      console.error('Ошибка импорта состояния:', error);
    }
    return false;
  }
}

// Создаем единственный экземпляр менеджера состояния
export const appStateManager = new AppStateManager();

// Добавляем глобальную функцию для сброса данных в консоли разработчика
if (typeof window !== 'undefined') {
  (window as any).resetAppData = () => {
    appStateManager.clearData();
    window.location.reload();
    console.log('✅ Данные приложения сброшены. Страница перезагружена.');
  };
  
  console.log('💡 Для сброса всех данных приложения используйте: resetAppData()');
}

// Хук для использования состояния в React компонентах
export const useAppState = () => {
  const [state, setState] = React.useState<AppState>(appStateManager.getState());

  React.useEffect(() => {
    const unsubscribe = appStateManager.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    state,
    updateProfile: (profile: UserProfile) => appStateManager.updateProfile(profile),
    updateDataFiles: (dataFiles: Partial<AppState['dataFiles']>) => appStateManager.updateDataFiles(dataFiles),
    updateFilters: (filters: Partial<AppState['filters']>) => appStateManager.updateFilters(filters),
    setLoading: (loading: boolean) => appStateManager.setLoading(loading),
    setError: (error: string | undefined) => appStateManager.setError(error),
    clearData: () => appStateManager.clearData(),
    hasData: () => appStateManager.hasData(),
    isModuleReady: (module: 'dashboard' | 'ar-ap' | 'plan-fact' | 'advisor') => appStateManager.isModuleReady(module)
  };
};
