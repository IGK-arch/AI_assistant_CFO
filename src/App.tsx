import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { ARAPCenter } from './pages/ARAPCenter';
import { FinancialAdvisor } from './pages/FinancialAdvisor';
import { PlanFactForecast } from './pages/PlanFactForecast';
import { AIAssistant } from './pages/AIAssistant';
import { Scenarios } from './pages/Scenarios';
import { useAppState } from './services/appState';
import { LoadingOverlay } from './components/ui';

function App() {
  const { state } = useAppState();

  // Показываем загрузку, если приложение инициализируется
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingOverlay>
          Загрузка приложения...
        </LoadingOverlay>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Онбординг */}
          <Route 
            path="/" 
            element={
              state.profile && (state.dataFiles.sales || state.dataFiles.ar_ap) 
                ? <Navigate to="/dashboard" replace />
                : <Onboarding />
            } 
          />
          
          {/* Главная панель */}
          <Route 
            path="/dashboard" 
            element={
              state.profile && (state.dataFiles.sales || state.dataFiles.ar_ap)
                ? <Dashboard />
                : <Navigate to="/" replace />
            } 
          />
          
          {/* AR/AP центр */}
          <Route 
            path="/ar-ap" 
            element={
              state.profile && (state.dataFiles.sales || state.dataFiles.ar_ap)
                ? <ARAPCenter />
                : <Navigate to="/" replace />
            } 
          />
          
          {/* План-Факт-Прогноз */}
          <Route 
            path="/plan-fact" 
            element={
              state.profile && (state.dataFiles.sales || state.dataFiles.ar_ap)
                ? <PlanFactForecast />
                : <Navigate to="/" replace />
            } 
          />
          
          {/* Финансовый эдвайзер */}
          <Route 
            path="/advisor" 
            element={
              state.profile && state.dataFiles.advisor
                ? <FinancialAdvisor />
                : <Navigate to="/" replace />
            } 
          />

          {/* AI Ассистент */}
          <Route 
            path="/ai-assistant" 
            element={
              state.profile && (state.dataFiles.sales || state.dataFiles.ar_ap)
                ? <AIAssistant />
                : <Navigate to="/" replace />
            } 
          />

          {/* Сценарии */}
          <Route 
            path="/scenarios" 
            element={
              state.profile && (state.dataFiles.sales || state.dataFiles.ar_ap)
                ? <Scenarios />
                : <Navigate to="/" replace />
            } 
          />

          {/* Перенаправление на главную для несуществующих маршрутов */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
