import { useState } from 'react';
import { Leaf, CircleCheck as CheckCircle, ShoppingCart, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'auditor' | 'developer' | 'buyer' | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const roles = [
    { id: 'auditor' as const, title: 'Auditor / Verifier', description: 'VVB/DOE verification, CIVV gateway configuration, registry validation', icon: CheckCircle, color: 'bg-blue-500' },
    { id: 'developer' as const, title: 'Project Developer', description: 'Plant data submission, token minting, exchange listing', icon: Building2, color: 'bg-green-500' },
    { id: 'buyer' as const, title: 'Credit Buyer', description: 'Purchase and retire carbon credits via exchange', icon: ShoppingCart, color: 'bg-purple-500' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!selectedRole) {
          setError('Please select a role');
          setLoading(false);
          return;
        }
        const { error: signUpError } = await signUp(email, password, selectedRole, companyName, phone);
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (selectedRole && isSignUp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <button onClick={() => setSelectedRole(null)} className="text-gray-600 hover:text-gray-900 mb-4">
            ← Back
          </button>
          <div className="text-center mb-6">
            <Leaf className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-gray-900">Sign Up as {roles.find(r => r.id === selectedRole)?.title}</h2>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50">
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={() => setIsSignUp(false)} className="text-emerald-600 hover:text-emerald-700 text-sm">Already have an account? Sign in</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Leaf className="w-16 h-16 text-emerald-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Blockvolt ERTH</h1>
          <p className="text-xl text-gray-600">Carbon Verification and Trading Platform</p>
        </div>

        {!isSignUp ? (
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign In</h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => setIsSignUp(true)} className="text-emerald-600 hover:text-emerald-700 text-sm">Don't have an account? Sign up</button>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-2">Test Credentials (password: TestPass123!):</p>
              <div className="space-y-1 text-xs text-gray-600">
                <div>developer@test.com — Project Developer</div>
                <div>auditor@test.com — Auditor / Verifier</div>
                <div>buyer@test.com — Credit Buyer</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div key={role.id} onClick={() => setSelectedRole(role.id)} className="bg-white rounded-xl shadow-lg p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl">
                  <div className={`${role.color} w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">{role.title}</h3>
                  <p className="text-gray-600 text-center mb-6">{role.description}</p>
                  <button className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold">Sign up as {role.title}</button>
                </div>
              );
            })}
          </div>
        )}

        {isSignUp && (
          <div className="mt-6 text-center">
            <button onClick={() => setIsSignUp(false)} className="text-gray-600 hover:text-gray-900 text-sm">Already have an account? Sign in</button>
          </div>
        )}
      </div>
    </div>
  );
}
