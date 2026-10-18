import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const [authed] = useState(() => !!localStorage.getItem('sh_auth'));

  if (!authed) return <Navigate to='/login' replace />;

  return (
    <div className='min-h-screen hud-bg text-[#dbe4ff] flex'>
      <Sidebar />
      <div className='flex-1 flex flex-col min-w-0'>
        <Header />
        <main className='flex-1 p-3 md:p-5 lg:p-6 overflow-x-hidden'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
