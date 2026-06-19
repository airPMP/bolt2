import { Bell, Leaf, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  notifications?: number;
}

export default function Navigation({ sidebarOpen, setSidebarOpen, notifications = 0 }: NavigationProps) {
  const { user, userProfile, signOut } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center ml-4">
              <Leaf className="w-8 h-8 text-emerald-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Blockvolt ERTH</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-900">
              <Bell className="w-6 h-6" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="font-medium text-gray-900">{user?.email}</div>
                {userProfile && (
                  <div className="text-sm text-gray-500 capitalize">
                    {userProfile.user_type} {userProfile.company_name && `- ${userProfile.company_name}`}
                  </div>
                )}
              </div>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
