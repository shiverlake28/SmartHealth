import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Boxes,
  Hospital,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCheck,
  Waves,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

type Kpis = { centers: number; bedOccupancyPct: number; testAvailabilityPct: number; openWarnings: number };

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const links = [
    { to: '/dashboard', label: t('common.dashboard'), icon: LayoutDashboard },
    { to: '/inventory', label: t('common.inventory'), icon: Boxes },
    { to: '/attendance', label: t('common.attendance'), icon: UserCheck },
    { to: '/alerts', label: t('common.alerts'), icon: AlertTriangle },
    { to: '/centers', label: t('common.centers'), icon: Hospital },
    { to: '/analytics', label: t('common.ai'), icon: Waves },
  ];

  return (
    <>
      <nav className='flex-1 space-y-1.5 p-3'>
        <div className='label-tech px-2 mb-2'>navigation</div>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition',
                isActive
                  ? 'bg-gradient-to-r from-cyan-400/15 to-transparent text-cyan-200 border border-cyan-400/35 shadow-[0_0_18px_rgba(34,211,238,0.15)]'
                  : 'text-[var(--muted)] border border-transparent hover:bg-[var(--surface)] hover:text-[var(--text)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className='absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r bg-cyan-300 shadow-[0_0_10px_#22d3ee]' />
                )}
                <Icon size={17} className='shrink-0' />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className='p-3 space-y-3 border-t border-[var(--line)]'>
        <DistrictModules />
        <NavLink
          to='/'
          onClick={() => localStorage.removeItem('sh_auth')}
          className='flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono-data text-rose-300 border border-rose-400/25 bg-rose-400/[0.06] hover:bg-rose-400/[0.12] transition'
        >
          <LogOut size={14} /> LOGOUT
        </NavLink>
      </div>
    </>
  );
}

function DistrictModules() {
  const [k, setK] = useState<Kpis | null>(null);
  useEffect(() => {
    let alive = true;
    api.get<Kpis>('/api/district/kpis').then((r) => { if (alive) setK(r); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const cards = [
    { label: 'Centres', val: k ? String(k.centers) : '—', color: 'text-cyan-300' },
    { label: 'Beds', val: k ? `${k.bedOccupancyPct}%` : '—', color: 'text-amber-300' },
    { label: 'Warn', val: k ? String(k.openWarnings) : '—', color: 'text-rose-300' },
  ];

  return (
    <div>
      <div className='label-tech px-1 mb-2'>district live</div>
      <div className='grid grid-cols-3 gap-2'>
        {cards.map((c) => (
          <div key={c.label} className='rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-center'>
            <div className={cn('font-mono-data text-[0.72rem] font-bold', c.color)}>{c.val}</div>
            <div className='label-tech !text-[0.5rem] !tracking-[0.1em]'>{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className='hidden md:flex flex-col w-[218px] shrink-0 border-r border-[var(--line)] bg-[var(--sidebar-bg)] backdrop-blur-md'>
        <div className='h-14 flex items-center px-4 border-b border-[var(--line)]'>
          <span className='font-display text-xs font-bold grad-cyan'>MISSION CONTROL</span>
        </div>
        <NavItems />
      </aside>

      <button
        onClick={() => setOpen(true)}
        className='md:hidden fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full border border-cyan-400/40 bg-[var(--bg-2)] flex items-center justify-center text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.35)]'
        aria-label='Open menu'
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className='md:hidden fixed inset-0 z-50 flex'>
          <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' onClick={() => setOpen(false)} />
          <aside className='relative w-64 h-full bg-[var(--sidebar-bg)] border-r border-[var(--line)] flex flex-col animate-rise'>
            <div className='h-14 flex items-center justify-between px-4 border-b border-[var(--line)]'>
              <span className='font-display text-xs font-bold grad-cyan'>MISSION CONTROL</span>
              <button onClick={() => setOpen(false)} aria-label='Close menu' className='text-[var(--muted)]'>
                <X size={18} />
              </button>
            </div>
            <div className='flex-1 flex flex-col overflow-y-auto'>
              <NavItems onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
