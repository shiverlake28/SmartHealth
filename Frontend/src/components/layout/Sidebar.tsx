import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BedDouble,
  Boxes,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCheck,
  Waves,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const links = [
  { to: '/dashboard', label: 'Command', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/attendance', label: 'Attendance', icon: UserCheck },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/analytics', label: 'AI Lab', icon: Waves },
];

const moduleCards = [
  { icon: Activity, label: 'Footfall', color: 'text-cyan-300', val: 'live' },
  { icon: BedDouble, label: 'Beds', color: 'text-amber-300', val: '66%' },
  { icon: FlaskConical, label: 'Tests', color: 'text-emerald-300', val: '67%' },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
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
                  : 'text-[#9fb0dd] border border-transparent hover:bg-white/[0.04] hover:text-[#dbe4ff]',
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
        <div className='label-tech px-1'>district modules</div>
        <div className='grid grid-cols-3 gap-2'>
          {moduleCards.map(({ icon: Icon, label, color, val }) => (
            <div
              key={label}
              className='rounded-lg border border-[var(--line)] bg-white/[0.03] p-2 text-center'
            >
              <Icon size={15} className={cn('mx-auto mb-1', color)} />
              <div className='font-mono-data text-[0.62rem] text-[#dbe4ff] font-bold'>{val}</div>
              <div className='label-tech !text-[0.5rem] !tracking-[0.12em]'>{label}</div>
            </div>
          ))}
        </div>

        <NavLink
          to='/'
          className='flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono-data text-rose-300 border border-rose-400/25 bg-rose-400/[0.06] hover:bg-rose-400/[0.12] transition'
        >
          <LogOut size={14} /> LOGOUT
        </NavLink>
      </div>
    </>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* desktop */}
      <aside className='hidden md:flex flex-col w-[218px] shrink-0 border-r border-[var(--line)] bg-[rgba(7,11,23,0.9)] backdrop-blur-md'>
        <div className='h-14 flex items-center px-4 border-b border-[var(--line)]'>
          <span className='font-display text-xs font-bold grad-cyan'>MISSION CONTROL</span>
        </div>
        <NavItems />
      </aside>

      {/* mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className='md:hidden fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full border border-cyan-400/40 bg-[#0a0f20] flex items-center justify-center text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.35)]'
        aria-label='Open menu'
      >
        <Menu size={20} />
      </button>

      {/* mobile drawer */}
      {open && (
        <div className='md:hidden fixed inset-0 z-50 flex'>
          <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' onClick={() => setOpen(false)} />
          <aside className='relative w-64 h-full bg-[#070b17] border-r border-[var(--line)] flex flex-col animate-rise'>
            <div className='h-14 flex items-center justify-between px-4 border-b border-[var(--line)]'>
              <span className='font-display text-xs font-bold grad-cyan'>MISSION CONTROL</span>
              <button onClick={() => setOpen(false)} aria-label='Close menu' className='text-[#9fb0dd]'>
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
