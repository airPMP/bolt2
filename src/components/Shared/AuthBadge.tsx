import { CircleCheck as CheckCircle, Circle as XCircle, Loader as Loader2, Clock } from 'lucide-react';
import type { AuthStamp } from '../../types';

interface AuthBadgeProps {
  status: 'pending' | 'authenticated' | 'failed' | 'expired';
  label: string;
  stamp?: AuthStamp | null;
  size?: 'sm' | 'md';
}

export default function AuthBadge({ status, label, stamp, size = 'md' }: AuthBadgeProps) {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  let icon;
  let bgColor;
  let textColor;
  let borderColor;
  let suffix = '';

  switch (status) {
    case 'authenticated':
      icon = <CheckCircle className={`${iconSize} text-emerald-600`} />;
      bgColor = 'bg-emerald-50';
      textColor = 'text-emerald-700';
      borderColor = 'border-emerald-200';
      if (stamp?.stamped_at) {
        const date = new Date(stamp.stamped_at);
        suffix = ` · ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
      }
      break;
    case 'failed':
      icon = <XCircle className={`${iconSize} text-red-600`} />;
      bgColor = 'bg-red-50';
      textColor = 'text-red-700';
      borderColor = 'border-red-200';
      break;
    case 'expired':
      icon = <Clock className={`${iconSize} text-amber-600`} />;
      bgColor = 'bg-amber-50';
      textColor = 'text-amber-700';
      borderColor = 'border-amber-200';
      break;
    default:
      icon = <Loader2 className={`${iconSize} text-gray-400 animate-spin`} />;
      bgColor = 'bg-gray-50';
      textColor = 'text-gray-500';
      borderColor = 'border-gray-200';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${bgColor} ${borderColor}`}>
      {icon}
      <span className={`${textSize} font-medium ${textColor}`}>{label}{suffix}</span>
    </div>
  );
}
