import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Activity, Stethoscope } from 'lucide-react';

function Particles() {
  const [items] = useState(() => Array.from({length: 20}, (_, i) => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: i * 0.3,
    duration: 3 + Math.random() * 4
  })));
  return (
    <div className='absolute inset-0 overflow-hidden'>
      {items.map((p, i) => (
        <div key={i} className='absolute w-2 h-2 bg-blue-400/30 rounded-full animate-float' style={{ left: p.left + '%', top: p.top + '%', animationDelay: p.delay + 's', animationDuration: p.duration + 's' }}></div>
      ))}
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(t);
  }, []);
  if (loading) {
    return (
      <div className='h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0b1026] via-[#0f1a3a] to-[#0b1026] text-white'>
        <div className='flex flex-col items-center gap-4 animate-pulse'>
          <div className='relative'>
            <Heart size={64} className='text-blue-400 animate-bounce'/>
            <Activity size={32} className='absolute -top-2 -right-2 text-green-400 animate-spin-slow'/>
          </div>
          <div className='text-lg tracking-widest uppercase'>Smart Health</div>
          <div className='text-sm text-zinc-400'>Initializing AI Platform...</div>
        </div>
      </div>
    );
  }
  return (
    <div className='min-h-screen w-full bg-gradient-to-br from-[#0b1026] via-[#0f1a3a] to-[#0b1026] text-white overflow-hidden relative'>
      <div className='absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(77,124,254,0.3),transparent_70%)]'></div>
      <Particles/>
      <nav className='relative z-10 flex items-center justify-between p-4 md:p-6 flex-wrap gap-4'>
        <div className='flex items-center gap-2'><Heart className='text-blue-400'/><span className='font-semibold text-lg'>Smart Health</span></div>
        <div className='flex gap-2 md:gap-4 text-xs md:text-sm'>
          <button onClick={()=>navigate('/login')} className='px-3 md:px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition'>Login</button>
          <button onClick={()=>navigate('/register')} className='px-3 md:px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 hover:opacity-90 transition'>Register</button>
        </div>
      </nav>
      <main className='relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-4'>
        <Stethoscope size={64} className='text-blue-400 mb-6 animate-pulse md:size-20'/>
        <h1 className='text-3xl sm:text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent'>AI-Driven Health Center</h1>
        <p className='text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl mb-8'>Real-time PHC/CHC management with stock monitoring, alerts, forecasts & smart redistribution</p>
        <button onClick={()=>navigate('/login')} className='px-6 md:px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-medium hover:scale-105 transition-transform'>Get Started</button>
      </main>
    </div>
  );
}

