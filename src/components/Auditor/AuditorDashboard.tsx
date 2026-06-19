import { useState, useEffect } from 'react';
import { CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../types/database';

type Project = Database['public']['Tables']['projects']['Row'];
type Verification = Database['public']['Tables']['verifications']['Row'];

export default function AuditorDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [creditsVerified, setCreditsVerified] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [projectsResult, verificationsResult] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('verifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (projectsResult.error) throw projectsResult.error;
      if (verificationsResult.error) throw verificationsResult.error;

      setProjects(projectsResult.data || []);
      setVerifications(verificationsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateVerification() {
    if (!selectedProject || !creditsVerified || !user) return;

    setVerifyLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('verifications')
        .insert({
          project_id: selectedProject.id,
          verifier_id: user.id,
          verification_type: 'periodic',
          status: 'completed',
          credits_verified: parseFloat(creditsVerified),
          verification_date: new Date().toISOString().split('T')[0],
          notes: verificationNotes,
        });

      if (error) throw error;

      setMessage('Verification submitted successfully!');
      setSelectedProject(null);
      setVerificationNotes('');
      setCreditsVerified('');
      loadData();
    } catch (error) {
      setMessage('Error submitting verification');
      console.error(error);
    } finally {
      setVerifyLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading auditor dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingCount = verifications.filter(v => v.status === 'pending').length;
  const completedCount = verifications.filter(v => v.status === 'completed').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Auditor Dashboard</h1>
        <p className="text-gray-600">Verify and validate carbon credit projects</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Total Projects</span>
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{projects.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Pending</span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{pendingCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Completed</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{completedCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Active Projects</span>
            <AlertCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {projects.filter(p => p.status === 'Active').length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Projects to Review</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600">{project.project_code}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'Active' ? 'bg-green-100 text-green-800' :
                      project.status === 'Verification' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-1 font-medium">{project.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Credits:</span>
                      <span className="ml-1 font-medium">{project.total_credits}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Create Verification
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Verifications</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {verifications.map((verification) => (
                <div key={verification.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {verification.verification_type} verification
                      </p>
                      <p className="text-xs text-gray-600">
                        {verification.verification_date}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      verification.status === 'completed' ? 'bg-green-100 text-green-800' :
                      verification.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      verification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {verification.status}
                    </span>
                  </div>
                  {verification.credits_verified && (
                    <div className="text-sm">
                      <span className="text-gray-600">Credits Verified:</span>
                      <span className="ml-1 font-medium">{verification.credits_verified} tCO2</span>
                    </div>
                  )}
                  {verification.notes && (
                    <p className="text-xs text-gray-600 mt-2">{verification.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Verification Report</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-1">{selectedProject.name}</p>
              <p className="text-xs text-gray-600">{selectedProject.project_code}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credits Verified (tCO2)
              </label>
              <input
                type="number"
                min="0"
                value={creditsVerified}
                onChange={(e) => setCreditsVerified(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Enter verified credits"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Notes
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Enter verification notes and findings"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedProject(null);
                  setVerificationNotes('');
                  setCreditsVerified('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVerification}
                disabled={!creditsVerified || verifyLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {verifyLoading ? 'Submitting...' : 'Submit Verification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
