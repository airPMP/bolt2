import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function DeveloperProfile() {
  const { user, userProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user && userProfile) {
      setEmail(user.email || '');
      setFirstName(userProfile.company_name || '');
      setPhone(userProfile.phone || '');
    }
  }, [user, userProfile]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          company_name: firstName,
          phone: phone,
        })
        .eq('id', user.id);

      if (error) throw error;
      setMessage('Profile updated successfully');
    } catch (error) {
      setMessage('Error updating profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account</h2>
        <p className="text-gray-600 mb-6">
          Manage your profile information and account settings
        </p>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company/Name</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last name</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail Address</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
              value={email}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="flex space-x-4 mb-8">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Account Management</h3>
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h4 className="text-red-800 font-medium mb-2">Close your account</h4>
            <p className="text-sm text-red-600 mb-3">
              Closing your account will permanently delete all your data and cannot be undone.
            </p>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
