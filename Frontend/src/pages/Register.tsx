import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, UserPlus } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'district_admin' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || form.password.length < 4) {
      setError(t('auth.invalid'));
      return;
    }
    localStorage.setItem('sh_auth', JSON.stringify({ name: form.name, email: form.email, role: form.role, at: Date.now() }));
    navigate('/dashboard');
  };

  const input = 'w-full px-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-sm font-mono-data text-[var(--text)] focus:outline-none focus:border-emerald-400/60';

  return (
    <div className='min-h-screen w-full hud-bg text-[var(--text)] flex items-center justify-center px-4 relative'>
      <div className='scanline' />
      <div className='w-full max-w-md panel p-8 rise relative'>
        <div className='flex flex-col items-center mb-6'>
          <img src='/logo.svg' alt='' className='h-12 w-12 rounded-lg mb-2 shadow-[0_0_20px_rgba(52,211,153,0.4)]' />
          <h1 className='font-display text-xl font-bold grad-green'>{t('auth.registerTitle')}</h1>
          <p className='text-dim text-sm'>{t('auth.registerSub')}</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <label className='block'>
            <span className='label-tech mb-1 block'>{t('auth.name')}</span>
            <input type='text' autoComplete='name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} required />
          </label>
          <label className='block'>
            <span className='label-tech mb-1 block'>{t('auth.email')}</span>
            <input type='email' autoComplete='email' value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} required />
          </label>
          <label className='block'>
            <span className='label-tech mb-1 block'>{t('auth.password')}</span>
            <input type='password' autoComplete='new-password' value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} required />
          </label>
          <label className='block'>
            <span className='label-tech mb-1 block'>{t('auth.role')}</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={input}>
              <option value='district_admin'>District Admin</option>
              <option value='phc_incharge'>PHC Incharge</option>
              <option value='chc_incharge'>CHC Incharge</option>
            </select>
          </label>
          {error && <p className='text-rose-300 text-xs font-mono-data' role='alert'>{error}</p>}
          <button
            type='submit'
            className='w-full py-3 rounded-lg border border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-100 font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:from-emerald-500/30 hover:to-cyan-500/30 transition'
          >
            <UserPlus size={18} /> {t('auth.register')}
          </button>
        </form>

        <p className='text-center text-sm text-dim mt-4'>
          {t('auth.haveAccount')}{' '}
          <button onClick={() => navigate('/login')} className='text-emerald-300 hover:underline'>{t('auth.login')}</button>
        </p>
        <div className='mt-4 flex items-center justify-center gap-2 text-[0.65rem] text-dim font-mono-data'>
          <Heart size={12} className='text-rose-300' /> demo · local session only
        </div>
      </div>
    </div>
  );
}
