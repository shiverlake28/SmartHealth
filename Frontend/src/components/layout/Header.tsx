import { useTranslation } from 'react-i18next';
import { Moon, Sun, RefreshCw, Globe } from 'lucide-react';
import { useState } from 'react';
export function Header() {
  const { i18n, t } = useTranslation();
  const [dark, setDark] = useState(true);
  return (
    <header className='h-14 flex items-center justify-between px-4 border-b border-white/10 bg-white/5 backdrop-blur-sm'>
      <div className='font-medium'>Smart Health</div>
      <div className='flex items-center gap-2'>
        <button onClick={()=> i18n.changeLanguage(i18n.language==='en'?'hi':'en')} className='px-2 py-1 rounded text-xs border border-white/10 flex items-center gap-1'><Globe size={14}/> {t('common.language')}</button>
        <button onClick={()=> setDark(!dark)} className='px-2 py-1 rounded text-xs border border-white/10 flex items-center gap-1'>{dark? <Moon size={14}/>:<Sun size={14}/>}{t('common.theme')}</button>
        <button className='px-2 py-1 rounded text-xs border border-white/10 flex items-center gap-1'><RefreshCw size={14}/>{t('common.autoRefresh')}</button>
      </div>
    </header>
  );
}

