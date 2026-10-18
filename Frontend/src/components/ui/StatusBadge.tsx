import { cn } from '../../lib/utils';
export function StatusBadge({ status }: { status: 'ok'|'warn'|'high'|'critical'|'info' }) {
  const map = {
    ok: 'bg-green-500/10 text-green-400 border-green-500/30',
    warn: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/10 text-red-400 border-red-500/30',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  } as const;
  return <span className={cn('px-2 py-0.5 rounded-full text-xs border', map[status])}>{status}</span>;
}

