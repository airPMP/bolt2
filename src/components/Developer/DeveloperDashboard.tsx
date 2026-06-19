import { useState } from 'react';
import { Home, User, Building, Activity, Database, Wallet, Users, Settings, Globe } from 'lucide-react';
import DeveloperOverview from './DeveloperOverview';
import DeveloperProfile from './DeveloperProfile';
import MyAssets from './MyAssets';
import CarbonDashboard from './CarbonDashboard';
import MyWallet from './MyWallet';
import ProjectWizard from './ProjectWizard';

export default function DeveloperDashboard() {
  const [activeNav, setActiveNav] = useState('overview');

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: Home },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'assets', label: 'My Assets', icon: Building },
    { id: 'carbon', label: 'Carbon Dashboard', icon: Database },
    { id: 'wallet', label: 'My Wallet', icon: Wallet },
    { id: 'wizard', label: 'Project Wizard', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeNav) {
      case 'overview':
        return <DeveloperOverview />;
      case 'profile':
        return <DeveloperProfile />;
      case 'assets':
        return <MyAssets />;
      case 'carbon':
        return <CarbonDashboard />;
      case 'wallet':
        return <MyWallet />;
      case 'wizard':
        return <ProjectWizard />;
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded mr-2" defaultChecked />
                    Email notifications
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded mr-2" defaultChecked />
                    SMS alerts
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded mr-2" />
                    Push notifications
                  </label>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">API Access</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Generate API Key
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return <DeveloperOverview />;
    }
  };

  return (
    <div className="flex">
      <div className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Navigation</h3>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeNav === item.id
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="flex-1 p-6">
        {renderContent()}
      </div>
    </div>
  );
}
