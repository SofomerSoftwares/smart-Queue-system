import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QueueProvider, useQueue } from './context/QueueContext';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DisplayView } from './components/DisplayView';
import { ReceptionView } from './components/ReceptionView';
import { OfficerStationView } from './components/OfficerStationView';
import { CustomerTicketView } from './components/CustomerTicketView';
import { AdminView } from './components/AdminView';
import { ReportsView } from './components/ReportsView';
import { LoginView } from './components/LoginView';
import { ChangePasswordModal } from './components/ChangePasswordModal';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const getInitialView = (): string => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam) return viewParam;
      if (params.get('ticket') || params.get('t') || params.get('checkin')) return 'customer';
    } catch {}
    return 'display';
  };

  const [currentView, setCurrentView] = useState<string>(getInitialView);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const renderView = () => {
    switch (currentView) {
      case 'display':
        return <DisplayView />;
      case 'reception':
        return <ReceptionView />;
      case 'officer':
        return <OfficerStationView />;
      case 'customer':
        return <CustomerTicketView />;
      case 'admin':
        return <AdminView />;
      case 'reports':
        return <ReportsView />;
      case 'login':
        return <LoginView onSuccess={() => setCurrentView('officer')} />;
      default:
        return <DisplayView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Layout */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-[padding] duration-300 ease-in-out will-change-[padding] ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        <TopHeader
          currentView={currentView}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 min-w-0">
          {renderView()}
        </main>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <QueueProvider>
        <AppContent />
      </QueueProvider>
    </AuthProvider>
  );
}

export default App;
