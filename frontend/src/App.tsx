import React, { useState } from 'react';
import { ZenoProvider } from './context/ZenoContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/Toast';

import { DashboardPage } from './pages/DashboardPage';
import { TalkPage } from './pages/TalkPage';
import { TeachPage } from './pages/TeachPage';
import { DevicePage } from './pages/DevicePage';
import { AiTestPage } from './pages/AiTestPage';
import { VisionPage } from './pages/VisionPage';
import { HistoryPage } from './pages/HistoryPage';
import { HealthAlertsPage } from './pages/HealthAlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LogsPage } from './pages/LogsPage';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} />;
      case 'talk':
        return <TalkPage />;
      case 'teach':
        return <TeachPage />;
      case 'device':
        return <DevicePage />;
      case 'ai-test':
        return <AiTestPage />;
      case 'vision':
        return <VisionPage />;
      case 'history':
        return <HistoryPage />;
      case 'health':
        return <HealthAlertsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'logs':
        return <LogsPage />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white pb-16 lg:pb-0">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {renderActivePage()}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ZenoProvider>
      <AppContent />
    </ZenoProvider>
  );
};

export default App;
