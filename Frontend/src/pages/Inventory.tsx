import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CalendarClock, Package, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { MetricTile } from '../components/ui/MetricTile';
import { api } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { cn } from '../lib/utils';

type InvRow = {
  centerId: string;
  medicineId: string;
  medicineName: string;
  centerName: string;
  centerType: string;
  qtyOnHand: number;
  qtyIssuedToday: number;
  qtyReceivedToday: number;
  avgDailyConsumption14d: number;
  unit: string;
  criticalMin: number;
  reorderPoint: number;
  leadTimeDays: number;
  daysOfStock: number;
  status: 'ok' | 'med' | 'high' | 'critical';
  nearExpiry: boolean;
  expiryDates: string[];
};

type Center = { id: string; name: string; type: string };

const statusChip: Record<InvRow['status'], string> = {
  critical: 'chip-critical',
  high: 'chip-high',
  med: 'chip-med',
  ok: 'chip-ok',
};

const statusMeter: Record<InvRow['status'], string> = {
  critical: 'crit',
  high: 'crit',
  med: 'warn',
  ok: 'ok',
};

const statusFilterOptions = ['all', 'critical', 'high', 'med', 'ok'] as const;

export default function Inventory() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<InvRow[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [q, setQ] = useState('');
  const [centerFilter, setCenterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilterOptions)[number]>('all');
  const [lastSync, setLastSync] = useState(() => new Date());
  const [, setErr] = useState<string | null>(null);

  const refresh = useCallback(() => {
    Promise.all([api.get<InvRow[]>('/api/inventory'), api.get<Center[]>('/api/centers')])
      .then(([inv, cs]) => {
        setRows(inv);
        setCenters(cs);
        setLastSync(new Date());
        setErr(null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  const { enabled: autoOn, setEnabled: setAutoOn } = useAutoRefresh(refresh, 30000);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (centerFilter !== 'all' && r.centerId !== centerFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (needle && !`${r.medicineName} ${r.centerName}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [rows, q, centerFilter, statusFilter]);

  const stats = useMemo(() => {
    const critical = rows.filter((r) => r.status === 'critical').length;
    const low = rows.filter((r) => r.status === 'high' || r.status === 'med').length;
    const expiry = rows.filter((r) => r.nearExpiry).length;
    const totalUnits = rows.reduce((a, r) => a + r.qtyOnHand, 0);
    return { critical, low, expiry, totalUnits, healthy: rows.length - critical - low };
  }, [rows]);

  return (
    <div className='space-y-5'>
      {/* header */}
      <div className='panel p-4 md:p-5 rise'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <div className='label-tech mb-1'>supply chain / stock monitor</div>
            <h1 className='font-display text-xl md:text-2xl font-bold grad-cyan'>
              {t('inventory.title')}
            </h1>
            <p className='text-dim text-sm mt-1'>{t('inventory.sub')}</p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='chip chip-info'>SYNC {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <button
              onClick={() => setAutoOn(!autoOn)}
              className={cn('panel px-3 py-1.5 !rounded-lg font-mono-data text-xs transition', autoOn ? 'glow-cyan text-cyan-200' : 'text-dim')}
              aria-pressed={autoOn}
            >
              AUTO {autoOn ? 'ON' : 'OFF'}
            </button>
            <button onClick={refresh} className='panel px-3 py-1.5 !rounded-lg font-mono-data text-xs text-[#dbe4ff] hover:glow-violet transition'>
              SYNC
            </button>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mt-4'>
          <MetricTile label={t('inventory.kpiLines')} value={rows.length} tone='blue' icon={<Package size={16} />} sub={`${stats.healthy} healthy stock lines`} progress={rows.length ? (stats.healthy / rows.length) * 100 : 0} />
          <MetricTile label={t('inventory.kpiCritical')} value={stats.critical} tone='rose' icon={<AlertTriangle size={16} />} sub='at or below critical min' progress={rows.length ? (stats.critical / rows.length) * 100 : 0} />
          <MetricTile label={t('inventory.kpiLow')} value={stats.low} tone='amber' icon={<SlidersHorizontal size={16} />} sub='below lead-time cover' progress={rows.length ? (stats.low / rows.length) * 100 : 0} />
          <MetricTile label={t('inventory.kpiExpiry')} value={stats.expiry} tone='violet' icon={<CalendarClock size={16} />} sub={`${stats.totalUnits} units in circulation`} progress={rows.length ? (stats.expiry / rows.length) * 100 : 0} />
        </div>
      </div>

      {/* filters */}
      <div className='panel p-3 flex flex-col sm:flex-row gap-2.5 sm:items-center rise'>
        <div className='relative flex-1 min-w-0'>
          <Search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#6f83b8]' />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('inventory.searchPlaceholder')}
            className='w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.04] border border-[var(--line)] text-sm text-[#dbe4ff] placeholder:text-[#6f83b8] focus:outline-none focus:border-cyan-400/60 font-mono-data'
          />
        </div>
        <select
          value={centerFilter}
          onChange={(e) => setCenterFilter(e.target.value)}
          className='px-3 py-2 rounded-lg bg-white/[0.04] border border-[var(--line)] text-sm text-[#dbe4ff] focus:outline-none focus:border-cyan-400/60 font-mono-data'
        >
          <option value='all'>{t('inventory.allCentres')}</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className='flex gap-1.5 flex-wrap'>
          {statusFilterOptions.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'chip transition',
                statusFilter === s ? (s === 'all' ? 'chip-info' : statusChip[s as InvRow['status']]) : 'chip-info opacity-40 hover:opacity-80',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <Panel kicker='live stock ledger' title={t('inventory.tableTitle')} action={<span className='chip chip-info'>{filtered.length} ROWS</span>}>
        <div className='overflow-x-auto'>
          <table className='w-full text-xs min-w-[760px]'>
            <thead>
              <tr className='label-tech text-left'>
                <th className='pb-2 pr-3'>centre</th>
                <th className='pb-2 pr-3'>medicine</th>
                <th className='pb-2 pr-3 text-right'>on hand</th>
                <th className='pb-2 pr-3 text-right'>avg/day</th>
                <th className='pb-2 pr-3'>days cover</th>
                <th className='pb-2 pr-3 text-right'>reorder</th>
                <th className='pb-2 pr-3'>expiry</th>
                <th className='pb-2'>status</th>
              </tr>
            </thead>
            <tbody className='font-mono-data'>
              {filtered.map((r, i) => (
                <tr key={`${r.centerId}-${r.medicineId}-${i}`} className='border-t border-white/6 hover:bg-white/[0.04] transition'>
                  <td className='py-2.5 pr-3'>
                    <div className='text-[#e6ecff] font-semibold truncate max-w-[130px]'>{r.centerName}</div>
                    <div className='label-tech !text-[0.55rem]'>{r.centerType} · {r.centerId.toUpperCase()}</div>
                  </td>
                  <td className='py-2.5 pr-3'>
                    <div className='text-[#dbe4ff]'>{r.medicineName}</div>
                    <div className='text-dim !text-[0.6rem]'>{r.leadTimeDays}d lead time</div>
                  </td>
                  <td className='py-2.5 pr-3 text-right'>
                    <span className={cn('font-bold', r.qtyOnHand <= r.criticalMin ? 'text-rose-300' : 'text-[#dbe4ff]')}>
                      {r.qtyOnHand}
                    </span>
                    <span className='text-dim'> {r.unit}</span>
                  </td>
                  <td className='py-2.5 pr-3 text-right text-cyan-300'>{r.avgDailyConsumption14d}</td>
                  <td className='py-2.5 pr-3 w-[150px]'>
                    <div className='flex items-center gap-2'>
                      <span className={cn('font-bold w-10', r.daysOfStock <= 2 ? 'text-rose-300' : r.daysOfStock <= 5 ? 'text-amber-300' : 'text-emerald-300')}>
                        {r.daysOfStock === 999 ? '∞' : `${r.daysOfStock}d`}
                      </span>
                      <div className={cn('meter flex-1', statusMeter[r.status])}>
                        <span style={{ width: `${Math.min(100, (r.daysOfStock / 14) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className='py-2.5 pr-3 text-right text-[#9fb0dd]'>{r.reorderPoint}</td>
                  <td className='py-2.5 pr-3'>
                    {r.expiryDates[0] ? (
                      <span className={cn(r.nearExpiry ? 'text-amber-300' : 'text-dim')}>
                        {r.nearExpiry && '? '}
                        {r.expiryDates[0].slice(5)}
                      </span>
                    ) : (
                      <span className='text-dim'>—</span>
                    )}
                  </td>
                  <td className='py-2.5'>
                    <span className={cn('chip', statusChip[r.status])}>{r.status}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className='py-10 text-center text-dim'>
                    <ShieldCheck size={18} className='mx-auto mb-2 text-emerald-300' />
                    {t('inventory.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}


