import { LayoutDashboard, Package, UserCheck, Bell, Brain } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
export function Sidebar() {
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inventory', label: 'Inventory', icon: Package },
    { to: '/attendance', label: 'Attendance', icon: UserCheck },
    { to: '/alerts', label: 'Alerts', icon: Bell },
    { to: '/analytics', label: 'AI', icon: Brain },
  ];
  return (
    <aside className='hidden md:flex flex-col w-64 border-r border-white/10 bg-white/5 backdrop-blur-sm'>
      <div className='p-4 text-lg font-semibold'>Smart Health</div>
      <nav className='flex-1 space-y-1 p-2'>
        {links.map(({to,label,icon:Icon})=> (
          <NavLink key={to} to={to} className={({isActive})=>cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5', isActive&&'bg-white/10')}>
            <Icon size={18}/> {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

