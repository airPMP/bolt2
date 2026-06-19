import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Navigation from './components/Layout/Navigation';
import DeveloperDashboard from './components/Developer/DeveloperDashboard';
import AuditorDashboard from './components/Auditor/AuditorDashboard';
import BuyerDashboard from './components/Buyer/BuyerDashboard';

function AppContent() {
  const { user, userProfile, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications] = useState(3);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        notifications={notifications}
      />

      <main>
        <div className="max-w-7xl mx-auto">
          {userProfile.user_type === 'developer' && <DeveloperDashboard />}
          {userProfile.user_type === 'auditor' && <AuditorDashboard />}
          {userProfile.user_type === 'buyer' && <BuyerDashboard />}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
