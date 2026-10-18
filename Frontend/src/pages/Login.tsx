import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, LogIn } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || form.password.length < 4) {
      setError(t('auth.invalid'));
      return;
    }
    localStorage.setItem('sh_auth', JSON.stringify({ email: form.email, role: 'district_admin', at: Date.now() }));
    navigate('/dashboard');
  };

  return (
    <div className='min-h-screen w-full hud-bg text-[#dbe4ff] flex items-center justify-center px-4 relative'>
      <div className='scanline' />
      <div className='w-full max-w-md panel p-8 rise relative'>
        <div className='flex flex-col items-center mb-6'>
          <img src='/logo.svg' alt='' className='h-12 w-12 rounded-lg mb-2 shadow-[0_0_20px_rgba(34,211,238,0.4)]' />
          <h1 className='font-display text-xl font-bold grad-cyan'>{t('auth.loginTitle')}</h1>
          <p className='text-dim text-sm'>{t('auth.loginSub')}</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <label className='block'>
            <span className='label-tech mb-1 block'>{t('auth.email')}</span>
            <input
              type='email'
              autoComplete='email'
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className='w-full px-4 py-3 rounded-lg bg-white/[0.02] border border-[var(--line)] text-sm font-mono-data text-[#dbe4ff] focus:outline-none focus:border-cyan-400/60'
              required
            />
          </label>
          <label className='block'>
            <span className='label-tech mb-1 block'>{t('auth.password')}</span>
            <input
              type='password'
              autoComplete='current-password'
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className='w-full px-4 py-3 rounded-lg bg-white/[0.02] border border-[var(--line)] text-sm font-mono-data text-[#dbe4ff] focus:outline-none focus:border-cyan-400/60'
              required
            />
          </label>
          {error && <p className='text-rose-300 text-xs font-mono-data' role='alert'>{error}</p>}
          <button
            type='submit'
            className='w-full py-3 rounded-lg border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-100 font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:from-cyan-500/30 hover:to-violet-500/30 transition'
          >
            <LogIn size={18} /> {t('auth.login')}
          </button>
        </form>

        <p className='text-center text-sm text-dim mt-4'>
          {t('auth.noAccount')}{' '}
          <button onClick={() => navigate('/register')} className='text-cyan-300 hover:underline'>{t('auth.register')}</button>
        </p>
        <div className='mt-4 flex items-center justify-center gap-2 text-[0.65rem] text-dim font-mono-data'>
          <Heart size={12} className='text-rose-300' /> demo · any email / password
        </div>
      </div>
    </div>
  );
}
