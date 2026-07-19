import { useState } from 'react';
import {
  Cpu,
  ShieldCheck,
  Network,
  Coins,
  FileCheck,
  Wallet,
  ArrowLeftRight,
  UserCheck,
  CheckCircle2,
  Loader2,
  Circle,
} from 'lucide-react';

export interface PipelineStage {
  key: string;
  label: string;
  icon: typeof Cpu;
  status: 'pending' | 'active' | 'done' | 'error';
  detail?: string;
}

export const PIPELINE_STAGES: Omit<PipelineStage, 'status' | 'detail'>[] = [
  { key: 'sensor', label: 'CIVV Sensor Data', icon: Cpu },
  { key: 'hsm', label: 'HSM Signature', icon: ShieldCheck },
  { key: 'merkle', label: 'Merkle Root', icon: Network },
  { key: 'mint', label: 'NFT Mint (Polygon)', icon: Coins },
  { key: 'registry', label: 'Registry Issuance', icon: FileCheck },
  { key: 'custody', label: 'Wallet Custody', icon: Wallet },
  { key: 'exchange', label: 'Exchange Trade', icon: ArrowLeftRight },
  { key: 'buyer', label: 'Buyer Wallet', icon: UserCheck },
];

interface WorkerPipelineProps {
  stages: PipelineStage[];
  compact?: boolean;
}

export default function WorkerPipeline({ stages, compact = false }: WorkerPipelineProps) {
  return (
    <div className={`flex flex-wrap items-stretch gap-2 ${compact ? '' : 'py-2'}`}>
      {PIPELINE_STAGES.map((stageDef, i) => {
        const stage = stages.find((s) => s.key === stageDef.key);
        const status = stage?.status ?? 'pending';
        const Icon = stageDef.icon;
        const colorMap: Record<string, string> = {
          pending: 'border-slate-700 bg-slate-900 text-slate-500',
          active: 'border-blue-500 bg-blue-950 text-blue-300 animate-pulse',
          done: 'border-emerald-600 bg-emerald-950 text-emerald-300',
          error: 'border-red-600 bg-red-950 text-red-300',
        };
        const StatusIcon = status === 'done' ? CheckCircle2 : status === 'active' ? Loader2 : Circle;
        return (
          <div key={stageDef.key} className="flex items-center gap-2">
            <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border ${colorMap[status]} ${compact ? 'min-w-[120px]' : 'min-w-[140px]'}`}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <StatusIcon className={`w-3.5 h-3.5 ${status === 'active' ? 'animate-spin' : ''}`} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-center leading-tight">
                {i + 1}. {stageDef.label}
              </span>
              {stage?.detail && (
                <span className="text-[9px] font-mono text-slate-400 text-center leading-tight mt-0.5 truncate max-w-[140px]">
                  {stage.detail}
                </span>
              )}
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div className={`h-px w-4 ${status === 'done' ? 'bg-emerald-600' : 'bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function usePipelineRunner() {
  const [stages, setStages] = useState<PipelineStage[]>(
    PIPELINE_STAGES.map((s) => ({ ...s, status: 'pending' as const }))
  );
  const [running, setRunning] = useState(false);

  async function run(onStage?: (key: string) => Promise<string | undefined>) {
    setRunning(true);
    const updated: PipelineStage[] = PIPELINE_STAGES.map((s) => ({ ...s, status: 'pending' as const }));
    setStages([...updated]);
    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      updated[i] = { ...updated[i], status: 'active' };
      setStages([...updated]);
      await new Promise((r) => setTimeout(r, 350));
      let detail: string | undefined;
      if (onStage) {
        try {
          detail = await onStage(PIPELINE_STAGES[i].key);
        } catch {
          updated[i] = { ...updated[i], status: 'error' };
          setStages([...updated]);
          setRunning(false);
          return;
        }
      }
      updated[i] = { ...updated[i], status: 'done', detail };
      setStages([...updated]);
    }
    setRunning(false);
  }

  return { stages, running, run, setStages };
}
