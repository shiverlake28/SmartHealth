import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
export function KpiCard({ title, value, icon }: { title: string; value: string|number; icon?: ReactNode }) {
  return (
    <div className={cn('rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 shadow-sm')}>
      <div className='flex items-center justify-between'>
        <div className='text-sm text-zinc-400'>{title}</div>
        {icon}
      </div>
      <div className='mt-2 text-2xl font-semibold'>{value}</div>
    </div>
  );
}

