import { useTranslation } from 'react-i18next';
import { Globe, Moon, RefreshCw, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function Header() {
  const { i18n, t } = useTranslation();
  const [dark, setDark] = useState(true);

  return (
    <header className='h-14 flex items-center justify-between gap-3 px-3 md:px-5 border-b border-[var(--line)] bg-[rgba(8,12,26,0.75)] backdrop-blur-md'>
      <Link to='/dashboard' className='flex items-center gap-2.5 min-w-0'>
        <img src='/logo.svg' alt='' className='h-7 w-7 rounded-md shadow-[0_0_16px_rgba(34,211,238,0.35)]' />
        <div className='min-w-0'>
          <div className='font-display text-sm font-bold grad-cyan leading-none truncate'>
            SMART HEALTH
          </div>
          <div className='label-tech !text-[0.55rem] mt-0.5 hidden sm:block'>
            AI · SUPPLY CHAIN OS
          </div>
        </div>
      </Link>

      <div className='flex items-center gap-1.5 md:gap-2'>
        <span className='hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-white/[0.03]'>
          <span className='pulse-dot' />
          <span className='font-mono-data text-[0.65rem] text-emerald-300'>LIVE</span>
        </span>

        <button
          onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en')}
          className='px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-white/[0.03] flex items-center gap-1.5 font-mono-data text-[0.68rem] text-[#dbe4ff] hover:border-cyan-400/50 hover:text-cyan-200 transition'
          aria-label={t('common.language')}
        >
          <Globe size={13} />
          {i18n.language === 'en' ? 'EN' : 'हि'}
        </button>

        <button
          onClick={() => setDark(!dark)}
          className='px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-white/[0.03] flex items-center gap-1.5 font-mono-data text-[0.68rem] text-[#dbe4ff] hover:border-violet-400/50 hover:text-violet-200 transition'
          aria-label={t('common.theme')}
        >
          {dark ? <Moon size={13} /> : <Sun size={13} />}
          <span className='hidden md:inline'>{t('common.theme')}</span>
        </button>

        <span className='hidden md:flex px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-white/[0.03] items-center gap-1.5 font-mono-data text-[0.68rem] text-cyan-200'>
          <RefreshCw size={13} className='animate-spin-slow' />
          {t('common.autoRefresh')}
        </span>
      </div>
    </header>
  );
}
