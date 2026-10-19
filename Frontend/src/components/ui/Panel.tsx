import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type PanelTone = 'default' | 'cyan' | 'violet' | 'rose' | 'amber';

const toneClass: Record<PanelTone, string> = {
  default: '',
  cyan: 'glow-cyan',
  violet: 'glow-violet',
  rose: 'glow-rose',
  amber: 'glow-amber',
};

export function Panel({
  title,
  kicker,
  action,
  tone = 'default',
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  kicker?: ReactNode;
  action?: ReactNode;
  tone?: PanelTone;
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
}) {
  return (
    <section className={cn('panel p-4 md:p-5 rise', toneClass[tone], className)}>
      {(title || kicker || action) && (
        <header className='flex items-start justify-between gap-3 mb-3 md:mb-4'>
          <div className='min-w-0'>
            {kicker && <div className='label-tech mb-1'>{kicker}</div>}
            {title && (
              <h2 className='font-display text-sm md:text-base font-semibold text-[var(--text)] truncate'>
                {title}
              </h2>
            )}
          </div>
          {action && <div className='shrink-0'>{action}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
