import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export function AppShell() {
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
