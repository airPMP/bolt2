import { CircleCheck as CheckCircle, Circle as XCircle, Loader as Loader2, ShieldCheck } from 'lucide-react';
import type { AuthStamp } from '../../types';

interface AuthStampPanelProps {
  stamps: AuthStamp[];
  loading: boolean;
}

export default function AuthStampPanel({ stamps, loading }: AuthStampPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking auth stamps...
      </div>
    );
  }

  if (stamps.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <ShieldCheck className="w-4 h-4" />
        No auth stamps yet
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
        <h3 className="text-sm font-semibold text-gray-900">Authentication Stamps</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {stamps.map((stamp) => {
          const isAuth = stamp.status === 'authenticated';
          return (
            <div
              key={stamp.id}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                isAuth
                  ? 'bg-emerald-50 border-emerald-200'
                  : stamp.status === 'failed'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {isAuth ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : stamp.status === 'failed' ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              )}
              <div className="flex flex-col">
                <span className={`text-xs font-medium ${
                  isAuth ? 'text-emerald-700' : stamp.status === 'failed' ? 'text-red-700' : 'text-gray-500'
                }`}>
                  {stamp.provider}
                </span>
                <span className="text-[10px] text-gray-400">
                  {stamp.provider_type} · {new Date(stamp.stamped_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              {isAuth && stamp.stamp_hash && (
                <span className="text-[10px] font-mono text-emerald-500 ml-1">
                  #{stamp.stamp_hash.slice(0, 8)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
