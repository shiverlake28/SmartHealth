import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';
export function AppShell() {
  return (
    <div className='min-h-screen bg-[#0b1026] text-zinc-100 flex'>
      <Sidebar/>
      <div className='flex-1 flex flex-col'>
        <Header/>
        <main className='flex-1 p-4 md:p-6 overflow-auto'>
          <Outlet/>
        </main>
      </div>
    </div>
  );
}

