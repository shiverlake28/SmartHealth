import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type MetricTone = 'cyan' | 'violet' | 'green' | 'amber' | 'rose' | 'blue';

const valueGrad: Record<MetricTone, string> = {
  cyan: 'grad-cyan',
  violet: 'grad-cyan',
  green: 'grad-green',
  amber: 'grad-amber',
  rose: 'grad-rose',
  blue: 'grad-blue',
};

const iconBox: Record<MetricTone, string> = {
  cyan: 'text-cyan-300 bg-cyan-400/10 border-cyan-400/30',
  violet: 'text-violet-300 bg-violet-400/10 border-violet-400/30',
  green: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30',
  amber: 'text-amber-300 bg-amber-400/10 border-amber-400/30',
  rose: 'text-rose-300 bg-rose-400/10 border-rose-400/30',
  blue: 'text-blue-300 bg-blue-400/10 border-blue-400/30',
};

const meterClass: Record<MetricTone, string> = {
  cyan: '',
  violet: '',
  green: 'ok',
  amber: 'warn',
  rose: 'crit',
  blue: 'ok',
};

export function MetricTile({
  label,
  value,
  unit,
  sub,
  delta,
  deltaGood,
  icon,
  tone = 'cyan',
  progress,
  spark,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  delta?: string;
  deltaGood?: boolean;
  icon?: ReactNode;
  tone?: MetricTone;
  progress?: number;
  spark?: number[];
}) {
  const pct = progress === undefined ? undefined : Math.max(0, Math.min(100, progress));
  return (
    <div className='panel sweep p-4 flex flex-col justify-between gap-3 min-h-[132px]'>
      <div className='flex items-start justify-between gap-2'>
        <div className='label-tech'>{label}</div>
        {icon && (
          <span
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-lg border',
              iconBox[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <div className='flex items-end justify-between gap-2'>
        <div className='flex items-baseline gap-1'>
          <span className={cn('font-display text-3xl md:text-[2.1rem] font-bold leading-none', valueGrad[tone])}>
            {value}
          </span>
          {unit && <span className='font-mono-data text-sm text-dim'>{unit}</span>}
        </div>
        {spark && spark.length > 1 && (
          <svg viewBox='0 0 100 32' className='h-8 w-24 shrink-0' aria-hidden='true'>
            <defs>
              <linearGradient id={`sp-${label.replace(/\W/g, '')}`} x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='rgba(34,211,238,0.55)' />
                <stop offset='100%' stopColor='rgba(34,211,238,0)' />
              </linearGradient>
            </defs>
            <polyline
              fill='none'
              stroke='#22d3ee'
              strokeWidth='2'
              strokeLinejoin='round'
              points={spark.map((v, i) => {
                const max = Math.max(...spark, 1);
                const min = Math.min(...spark);
                const x = (i / (spark.length - 1)) * 98 + 1;
                const y = 30 - ((v - min) / Math.max(max - min, 1)) * 26;
                return `${x},${y}`;
              }).join(' ')}
            />
          </svg>
        )}
      </div>

      <div>
        {pct !== undefined && (
          <div className={cn('meter mb-1.5', meterClass[tone])}>
            <span style={{ width: `${pct}%` }} />
          </div>
        )}
        <div className='flex items-center justify-between gap-2 text-xs'>
          <span className='text-dim truncate'>{sub}</span>
          {delta && (
            <span
              className={cn(
                'font-mono-data font-semibold shrink-0',
                deltaGood ? 'text-emerald-300' : 'text-rose-300',
              )}
            >
              {delta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
