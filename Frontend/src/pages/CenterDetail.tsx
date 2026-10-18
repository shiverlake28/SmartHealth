import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BedDouble, FlaskConical, Package, UserCheck, Users } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { MetricTile } from '../components/ui/MetricTile';
import { api } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { cn } from '../lib/utils';

type Overview = {
  id: string;
  name: string;
  type: string;
  district: string;
  status: string;
  kpis: {
    lowStock: number;
    footfallToday: number;
    bedsAvailable: number;
    bedsTotal: number;
    bedOccupancyPct: number;
    attendancePct: number;
    testAvailabilityPct: number;
    openWarnings: number;
  };
  warnings: {
    medicineName: string;
    severity: string;
    daysOfStock: number;
    qtyOnHand: number;
    reason: string;
    suggestedAction: string;
  }[];
};

type InvRow = {
  medicineName: string;
  qtyOnHand: number;
  unit: string;
  daysOfStock: number;
  status: string;
  avgDailyConsumption14d: number;
};

const sevChip: Record<string, string> = {
  critical: 'chip-critical', high: 'chip-high', med: 'chip-med', low: 'chip-low', ok: 'chip-ok',
};

export default function CenterDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [ov, setOv] = useState<Overview | null>(null);
  const [inv, setInv] = useState<InvRow[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);

  const refresh = useCallback(() => {
    if (!id) return;
    Promise.all([
      api.get<Overview>(`/api/centers/${id}/overview`),
      api.get<InvRow[]>(`/api/inventory?centerId=${id}`),
    ])
      .then(([o, i]) => {
        hasLoaded.current = true;
        setOv(o);
        setInv(i);
        setNotFound(false);
      })
      .catch(() => {
        if (!hasLoaded.current) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const { enabled: autoOn } = useAutoRefresh(refresh, 30000);
  useEffect(() => { refresh(); }, [refresh]);

  if (id && loading) {
    return (
      <div className='panel p-10 text-center rise'>
        <p className='text-dim'>Loading…</p>
      </div>
    );
  }

  if (!id || notFound || !ov) {
    return (
      <div className='panel p-10 text-center rise'>
        <p className='text-dim'>{t('ai.empty')}</p>
        <Link to='/dashboard' className='chip chip-info inline-flex mt-3'>← BACK</Link>
      </div>
    );
  }

  const k = ov.kpis;

  return (
    <div className='space-y-5'>
      {/* header */}
      <div className='panel p-4 md:p-5 relative overflow-hidden rise'>
        <div className='scanline' />
        <div className='relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <Link to='/dashboard' className='label-tech inline-flex items-center gap-1.5 mb-2 hover:text-cyan-300 transition'>
              <ArrowLeft size={11} /> district command
            </Link>
            <div className='flex flex-wrap items-center gap-2.5'>
              <h1 className='font-display text-xl md:text-2xl font-bold grad-cyan'>{ov.name}</h1>
              <span className='chip chip-info'>{ov.type}</span>
              <span className={cn('chip', autoOn ? 'chip-ok' : 'chip-med')}>{autoOn ? 'live' : 'paused'}</span>
            </div>
            <p className='text-dim text-sm mt-1'>{ov.district} · centre id {ov.id.toUpperCase()}</p>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-5 mt-4'>
          <MetricTile label={t('dashboard.kpiStockRisk')} value={k.lowStock} tone='rose' icon={<Package size={16} />}
            sub={`${k.openWarnings} open warnings`} progress={Math.min(100, k.lowStock * 25)} />
          <MetricTile label='Footfall Today' value={k.footfallToday} tone='cyan' icon={<Users size={16} />} sub='patients seen today' />
          <MetricTile label={t('dashboard.kpiBedOccupancy')} value={k.bedOccupancyPct} unit='%' tone='amber' icon={<BedDouble size={16} />}
            sub={`${k.bedsAvailable}/${k.bedsTotal} beds free`} progress={k.bedOccupancyPct} />
          <MetricTile label={t('dashboard.kpiAttendance')} value={k.attendancePct} unit='%' tone='green' icon={<UserCheck size={16} />}
            sub='on-duty doctors' progress={k.attendancePct} />
          <MetricTile label={t('dashboard.kpiTestAvail')} value={k.testAvailabilityPct} unit='%' tone='blue' icon={<FlaskConical size={16} />}
            sub='test lab uptime' progress={k.testAvailabilityPct} />
        </div>
      </div>

      <div className='grid gap-5 xl:grid-cols-3'>
        {/* stock */}
        <Panel className='xl:col-span-2' tone='cyan' kicker='centre stock' title={t('inventory.tableTitle')}
          action={<Link to='/inventory' className='chip chip-info hover:brightness-125 transition'>FULL LEDGER</Link>}>
          <div className='overflow-x-auto'>
            <table className='w-full text-xs min-w-[440px]'>
              <thead>
                <tr className='label-tech text-left'>
                  <th className='pb-2 pr-3'>medicine</th>
                  <th className='pb-2 pr-3 text-right'>on hand</th>
                  <th className='pb-2 pr-3 text-right'>avg/day</th>
                  <th className='pb-2 pr-3'>days cover</th>
                  <th className='pb-2'>status</th>
                </tr>
              </thead>
              <tbody className='font-mono-data'>
                {inv.map((r, i) => (
                  <tr key={i} className='border-t border-white/[0.03] hover:bg-white/[0.02] transition'>
                    <td className='py-2.5 pr-3 text-[#e6ecff] font-semibold'>{r.medicineName}</td>
                    <td className='py-2.5 pr-3 text-right text-[#dbe4ff]'>{r.qtyOnHand} <span className='text-dim'>{r.unit}</span></td>
                    <td className='py-2.5 pr-3 text-right text-cyan-300'>{r.avgDailyConsumption14d}</td>
                    <td className='py-2.5 pr-3 w-[140px]'>
                      <div className='flex items-center gap-2'>
                        <span className={cn('font-bold w-10', r.daysOfStock <= 2 ? 'text-rose-300' : r.daysOfStock <= 5 ? 'text-amber-300' : 'text-emerald-300')}>
                          {r.daysOfStock === 999 ? '∞' : `${r.daysOfStock}d`}
                        </span>
                        <div className={cn('meter flex-1', r.status === 'critical' || r.status === 'high' ? 'crit' : r.status === 'med' ? 'warn' : 'ok')}>
                          <span style={{ width: `${Math.min(100, (r.daysOfStock / 14) * 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className='py-2.5'><span className={cn('chip', sevChip[r.status] ?? 'chip-ok')}>{r.status}</span></td>
                  </tr>
                ))}
                {inv.length === 0 && <tr><td colSpan={5} className='py-8 text-center text-dim'>{t('inventory.empty')}</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* warnings */}
        <Panel tone='rose' kicker='ai / early warning' title={t('dashboard.stockWarnings')}
          action={<span className='chip chip-critical'>{ov.warnings.length}</span>}>
          <ul className='space-y-2.5 max-h-[360px] overflow-y-auto pr-1'>
            {ov.warnings.length === 0 && <li className='text-dim text-sm py-6 text-center'>All clear at this centre.</li>}
            {ov.warnings.map((w, i) => (
              <li key={i} className='rounded-lg border border-white/[0.04] bg-white/[0.015] p-3'>
                <div className='flex items-center justify-between gap-2 mb-1.5'>
                  <span className='font-semibold text-sm text-[#e6ecff] truncate'>{w.medicineName}</span>
                  <span className={cn('chip', sevChip[w.severity] ?? 'chip-med')}>{w.severity}</span>
                </div>
                <div className='font-mono-data text-xs text-amber-300 mb-2'>{w.daysOfStock}d cover · {w.qtyOnHand} left</div>
                <div className='meter crit mb-2'><span style={{ width: `${Math.min(100, (w.daysOfStock / 5) * 100)}%` }} /></div>
                <p className='text-xs text-dim leading-relaxed'>{w.reason}</p>
                <p className='text-xs mt-1 text-emerald-300'>→ {w.suggestedAction}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
