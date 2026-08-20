import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QueueProvider, useQueue } from './context/QueueContext';
import { Navbar } from './components/Navbar';
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
  const [currentView, setCurrentView] = useState<string>('display');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      <main className="flex-1">
        {renderView()}
      </main>

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
