import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BedDouble, FlaskConical, Hospital, UserCheck, Users } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { api } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { cn } from '../lib/utils';

type Center = { id: string; name: string; type: string; district: string; status: string };
type Kpis = { bedOccupancyPct: number; attendancePct: number; testAvailabilityPct: number; stockRisk: number };

export default function Centers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [centers, setCenters] = useState<Center[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [error, setError] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([api.get<Center[]>('/api/centers'), api.get<Kpis>('/api/district/kpis')])
      .then(([c, k]) => { setCenters(c); setKpis(k); setError(false); })
      .catch(() => setError(true));
  }, []);

  const { enabled: autoOn } = useAutoRefresh(refresh, 30000);
  useEffect(() => { refresh(); }, [refresh]);

  const metric = (label: string, value: number, icon: ReactNode, tone: string) => (
    <div className='rounded-lg border border-[var(--line)] bg-white/[0.015] p-2 text-center'>
      <div className={cn('mx-auto mb-1', tone)}>{icon}</div>
      <div className='font-mono-data text-sm font-bold text-[#dbe4ff]'>{value}%</div>
      <div className='label-tech !text-[0.5rem] !tracking-[0.1em]'>{label}</div>
    </div>
  );

  return (
    <div className='space-y-5'>
      <div className='panel p-4 md:p-5 relative overflow-hidden rise'>
        <div className='scanline' />
        <div className='relative flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <div className='label-tech mb-1'>district inventory</div>
            <h1 className='font-display text-xl md:text-2xl font-bold grad-cyan'>{t('centers.title')}</h1>
            <p className='text-dim text-sm mt-1'>{t('centers.sub')}</p>
          </div>
          <span className={cn('chip', autoOn ? 'chip-ok' : 'chip-med')}>{autoOn ? 'live' : 'paused'}</span>
        </div>
      </div>

      {error && centers.length === 0 && (
        <div className='panel p-8 text-center text-dim rise'>Backend unreachable — start the API on :3001.</div>
      )}

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {centers.map((c) => (
          <Panel key={c.id} tone='cyan' className='cursor-pointer hover:brightness-110 transition' kicker={c.type} title={c.name}
            action={<span className={cn('chip', c.status === 'active' ? 'chip-ok' : 'chip-med')}>{c.status}</span>}>
            <button onClick={() => navigate(`/centers/${c.id}`)} className='w-full text-left'>
              <div className='flex items-center gap-2 text-sm text-dim mb-3'>
                <Hospital size={14} className='text-cyan-300' />
                {c.district} · {c.id.toUpperCase()}
              </div>
              <div className='grid grid-cols-3 gap-2'>
                {metric(t('centers.beds'), kpis ? 100 - kpis.bedOccupancyPct : 0, <BedDouble size={14} />, 'text-amber-300')}
                {metric(t('centers.attendance'), kpis ? kpis.attendancePct : 0, <UserCheck size={14} />, 'text-emerald-300')}
                {metric(t('centers.tests'), kpis ? kpis.testAvailabilityPct : 0, <FlaskConical size={14} />, 'text-blue-300')}
              </div>
              <div className='mt-3 flex items-center justify-between'>
                <span className='chip chip-info'>{t('centers.view')} →</span>
                <span className='flex items-center gap-1 text-xs text-dim font-mono-data'>
                  <Users size={12} /> {kpis?.stockRisk ?? 0} at risk
                </span>
              </div>
            </button>
          </Panel>
        ))}
      </div>

      {!error && centers.length === 0 && (
        <div className='panel p-10 text-center text-dim rise'>{t('centers.empty')}</div>
      )}
    </div>
  );
}
