import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, BarChart3, Heart, Share2, Stethoscope } from 'lucide-react';

function Particles() {
  const [items] = useState(() => Array.from({ length: 22 }, (_, i) => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: i * 0.3,
    duration: 4 + Math.random() * 5,
  })));
  return (
    <div className='absolute inset-0 overflow-hidden'>
      {items.map((p, i) => (
        <div
          key={i}
          className='absolute w-1.5 h-1.5 rounded-full bg-cyan-400/40 animate-float'
          style={{ left: p.left + '%', top: p.top + '%', animationDelay: p.delay + 's', animationDuration: p.duration + 's' }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className='h-screen w-full hud-bg flex items-center justify-center text-white relative'>
        <div className='scanline' />
        <div className='flex flex-col items-center gap-5 relative'>
          <div className='relative'>
            <Heart size={64} className='text-cyan-400 animate-pulse' />
            <Activity size={28} className='absolute -top-2 -right-2 text-emerald-400 animate-spin-slow' />
          </div>
          <div className='font-display text-lg tracking-[0.3em] grad-cyan uppercase'>Smart Health</div>
          <div className='label-tech'>{t('home.splashInit')}…</div>
          <div className='meter w-48'><span className='!animate-pulse' style={{ width: '70%' }} /></div>
        </div>
      </div>
    );
  }

  const features = [
    { icon: Activity, label: t('home.f1'), color: 'text-cyan-300' },
    { icon: BarChart3, label: t('home.f2'), color: 'text-violet-300' },
    { icon: Share2, label: t('home.f3'), color: 'text-emerald-300' },
  ];

  return (
    <div className='min-h-screen w-full hud-bg text-[#dbe4ff] overflow-hidden relative'>
      <div className='scanline' />
      <Particles />

      <nav className='relative z-10 flex items-center justify-between p-4 md:p-6 flex-wrap gap-4'>
        <div className='flex items-center gap-2.5'>
          <img src='/logo.svg' alt='' className='h-8 w-8 rounded-md shadow-[0_0_18px_rgba(34,211,238,0.4)]' />
          <span className='font-display font-bold grad-cyan'>SMART HEALTH</span>
        </div>
        <div className='flex gap-2 md:gap-3 text-xs md:text-sm font-mono-data'>
          <button onClick={() => navigate('/login')} className='px-4 py-2 rounded-lg border border-[var(--line)] bg-white/[0.015] hover:border-cyan-400/50 hover:text-cyan-200 transition uppercase tracking-wider'>
            {t('home.login')}
          </button>
          <button onClick={() => navigate('/register')} className='px-4 py-2 rounded-lg border border-cyan-400/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20 transition uppercase tracking-wider'>
            {t('home.register')}
          </button>
        </div>
      </nav>

      <main className='relative z-10 flex flex-col items-center justify-center min-h-[78vh] text-center px-4'>
        <div className='panel px-6 py-10 md:px-14 md:py-14 max-w-3xl rise'>
          <Stethoscope size={56} className='text-cyan-400 mb-6 mx-auto animate-pulse' />
          <h1 className='font-display text-3xl sm:text-4xl md:text-6xl font-bold grad-cyan mb-4'>
            {t('home.tagline')}
          </h1>
          <p className='text-base sm:text-lg text-[#9fb0dd] max-w-2xl mb-8 mx-auto'>{t('home.subtitle')}</p>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8'>
            {features.map(({ icon: Icon, label, color }) => (
              <div key={label} className='rounded-xl border border-[var(--line)] bg-white/[0.015] p-4'>
                <Icon size={20} className={`mx-auto mb-2 ${color}`} />
                <div className='text-xs text-[#c7d2fe] font-semibold'>{label}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/login')}
            className='px-8 py-3 rounded-xl border border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-100 font-display font-bold uppercase tracking-wider hover:from-cyan-500/30 hover:to-violet-500/30 hover:scale-[1.03] transition'
          >
            {t('home.getStarted')}
          </button>
        </div>
      </main>
    </div>
  );
}
