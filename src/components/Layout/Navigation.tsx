import { Leaf, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Navigation() {
  const { userProfile, signOut } = useAuth();
  const personaLabel = userProfile ? userProfile.user_type.charAt(0).toUpperCase() + userProfile.user_type.slice(1) : '';
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <Leaf className="w-8 h-8 text-emerald-600" />
        <div><h1 className="text-lg font-bold text-gray-900">Blockvolt ERTH</h1><p className="text-xs text-gray-500 hidden sm:block">Carbon Verification & Trading Platform</p></div>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${userProfile?.user_type === 'auditor' ? 'bg-blue-100 text-blue-700' : userProfile?.user_type === 'developer' ? 'bg-green-100 text-green-700' : userProfile?.user_type === 'community' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>{personaLabel}</span>
        <div className="flex items-center gap-2"><User className="w-5 h-5 text-gray-400" /><span className="text-sm text-gray-600 hidden sm:block">{userProfile?.company_name}</span></div>
        <button onClick={signOut} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700" title="Sign Out"><LogOut className="w-5 h-5" /></button>
      </div>
    </header>
  );
}
