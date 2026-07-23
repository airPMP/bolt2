import { Leaf, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  notifications: number;
}

export default function Navigation({ sidebarOpen, setSidebarOpen, notifications }: NavigationProps) {
  const { userProfile, signOut } = useAuth();

  const personaLabel = userProfile
    ? userProfile.user_type.charAt(0).toUpperCase() + userProfile.user_type.slice(1)
    : '';

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 sticky top-0 z-40">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex items-center gap-2 ml-2">
        <Leaf className="w-8 h-8 text-emerald-600" />
        <div>
          <h1 className="text-lg font-bold text-gray-900">Blockvolt ERTH</h1>
          <p className="text-xs text-gray-500 hidden sm:block">Carbon Verification & Trading Platform</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            userProfile?.user_type === 'auditor' ? 'bg-blue-100 text-blue-700' :
            userProfile?.user_type === 'developer' ? 'bg-green-100 text-green-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {personaLabel}
          </span>
        </div>

        {notifications > 0 && (
          <div className="relative">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {notifications}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600 hidden sm:block">{userProfile?.company_name}</span>
        </div>

        <button
          onClick={signOut}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
