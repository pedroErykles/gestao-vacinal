import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './components/DashboardPage';
import { VacinasPage } from './components/VacinasPage';
import { LotesPage } from './components/LotesPage';
import { RegistrosPage } from './components/RegistrosPage';
import { CampanhasPage } from './components/CampanhasPage';
import { RelatoriosPage } from './components/RelatoriosPage';
import { Toaster } from 'sonner';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'vacinas':
        return <VacinasPage />;
      case 'lotes':
        return <LotesPage />;
      case 'registros':
        return <RegistrosPage />;
      case 'campanhas':
        return <CampanhasPage />;
      case 'relatorios':
        return <RelatoriosPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AppProvider>
  );
}