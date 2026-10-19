import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, Check, CheckCheck, Filter, Siren } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { MetricTile } from '../components/ui/MetricTile';
import { api } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { cn } from '../lib/utils';

type AlertRow = {
  id: string;
  centerId: string;
  centerName: string;
  centerType: string;
  type: string;
  severity: 'low' | 'med' | 'high' | 'critical';
  createdAt: string;
  status: 'open' | 'ack';
  message: string;
};

type Center = { id: string; name: string };

const severityChip: Record<AlertRow['severity'], string> = {
  critical: 'chip-critical',
  high: 'chip-high',
  med: 'chip-med',
  low: 'chip-low',
};

const severityBar: Record<AlertRow['severity'], string> = {
  critical: 'border-l-rose-500 border-rose-500/25 bg-rose-500/[0.06]',
  high: 'border-l-orange-400 border-orange-400/25 bg-orange-400/[0.06]',
  med: 'border-l-amber-300 border-amber-300/25 bg-amber-300/[0.06]',
  low: 'border-l-emerald-400 border-emerald-400/25 bg-emerald-400/[0.06]',
};

const typeIcons: Record<string, typeof Bell> = {
  stock_out_risk: Siren,
  test_unavailable: Filter,
};

export default function Alerts() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [statusFilter, setStatusFilter] = useState<'open' | 'ack' | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertRow['severity']>('all');
  const [centerFilter, setCenterFilter] = useState('all');
  const [lastSync, setLastSync] = useState(() => new Date());
  const [acking, setAcking] = useState<string | null>(null);

  const refresh = useCallback(() => {
    Promise.all([api.get<AlertRow[]>('/api/alerts?status=all'), api.get<Center[]>('/api/centers')])
      .then(([a, c]) => {
        setAlerts(a);
        setCenters(c);
        setLastSync(new Date());
      })
      .catch(() => {});
  }, []);

  const { enabled: autoOn, setEnabled: setAutoOn } = useAutoRefresh(refresh, 30000);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(
    () =>
      alerts.filter((a) => {
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
        if (centerFilter !== 'all' && a.centerId !== centerFilter) return false;
        return true;
      }),
    [alerts, statusFilter, severityFilter, centerFilter],
  );

  const stats = useMemo(() => {
    const open = alerts.filter((a) => a.status === 'open');
    return {
      open: open.length,
      critical: open.filter((a) => a.severity === 'critical').length,
      ack: alerts.filter((a) => a.status === 'ack').length,
      total: alerts.length,
    };
  }, [alerts]);

  const ack = async (id: string) => {
    setAcking(id);
    try {
      await api.post(`/api/alerts/${id}/ack`, {});
      await refresh();
    } catch {
      // ack request failed — leave alert as-is
    } finally {
      setAcking(null);
    }
  };

  return (
    <div className='space-y-5'>
      {/* header + KPIs */}
      <div className='panel p-4 md:p-5 rise'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <div className='label-tech mb-1'>event stream / intervention</div>
            <h1 className='font-display text-xl md:text-2xl font-bold grad-cyan'>{t('alerts.title')}</h1>
            <p className='text-dim text-sm mt-1'>{t('alerts.sub')}</p>
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
            <button onClick={refresh} className='panel px-3 py-1.5 !rounded-lg font-mono-data text-xs text-[var(--text)] hover:glow-violet transition'>
              SYNC
            </button>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mt-4'>
          <MetricTile label={t('alerts.kpiOpen')} value={stats.open} tone='amber' icon={<Bell size={16} />} sub='awaiting action' progress={stats.total ? (stats.open / stats.total) * 100 : 0} />
          <MetricTile label={t('alerts.kpiCritical')} value={stats.critical} tone='rose' icon={<Siren size={16} />} sub='need immediate intervention' progress={stats.total ? (stats.critical / stats.total) * 100 : 0} />
          <MetricTile label={t('alerts.kpiAck')} value={stats.ack} tone='green' icon={<CheckCheck size={16} />} sub='acknowledged by admin' progress={stats.total ? (stats.ack / stats.total) * 100 : 0} />
          <MetricTile label={t('alerts.kpiTotal')} value={stats.total} tone='blue' icon={<BellOff size={16} />} sub='all-time events' />
        </div>
      </div>

      {/* filters */}
      <div className='panel p-3 flex flex-col md:flex-row gap-3 md:items-center rise'>
        <div className='flex items-center gap-2'>
          <span className='label-tech'>{t('alerts.filters')}</span>
        </div>
        <div className='flex gap-1.5 flex-wrap'>
          {(['all', 'open', 'ack'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn('chip transition', statusFilter === s ? 'chip-info' : 'chip-info opacity-40 hover:opacity-80')}
            >
              {s}
            </button>
          ))}
        </div>
        <div className='flex gap-1.5 flex-wrap'>
          {(['all', 'critical', 'high', 'med', 'low'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={cn('chip transition', severityFilter === s ? (s === 'all' ? 'chip-info' : severityChip[s]) : 'chip-info opacity-40 hover:opacity-80')}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={centerFilter}
          onChange={(e) => setCenterFilter(e.target.value)}
          className='px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-cyan-400/60 font-mono-data md:ml-auto'
        >
          <option value='all'>{t('inventory.allCentres')}</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* alert cards */}
      <Panel kicker='alert feed' title={t('alerts.feedTitle')} action={<span className='chip chip-high'>{filtered.length} EVENTS</span>}>
        <ul className='space-y-3'>
          {filtered.map((a) => {
            const Icon = typeIcons[a.type] ?? Bell;
            return (
              <li
                key={a.id}
                className={cn('rounded-lg border border-l-[3px] p-3.5 transition', severityBar[a.severity], a.status === 'ack' && 'opacity-55')}
              >
                <div className='flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='min-w-0 flex items-start gap-3'>
                    <span className='mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)]'>
                      <Icon size={15} className={a.severity === 'critical' ? 'text-rose-300' : a.severity === 'high' ? 'text-orange-300' : 'text-amber-200'} />
                    </span>
                    <div className='min-w-0'>
                      <div className='flex flex-wrap items-center gap-2 mb-1'>
                        <span className='text-sm font-semibold text-[var(--text)]'>{a.message}</span>
                        <span className={cn('chip', severityChip[a.severity])}>{a.severity}</span>
                        {a.status === 'ack' && <span className='chip chip-ok'>acknowledged</span>}
                      </div>
                      <div className='flex flex-wrap items-center gap-2 text-xs font-mono-data text-dim'>
                        <span className='text-cyan-300'>{a.centerName}</span>
                        <span>·</span>
                        <span>{a.centerType}</span>
                        <span>·</span>
                        <span>{new Date(a.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className='uppercase text-amber-300'>[{a.type.replace(/_/g, ' ')}]</span>
                      </div>
                    </div>
                  </div>

                  {a.status === 'open' ? (
                    <button
                      onClick={() => ack(a.id)}
                      disabled={acking === a.id}
                      className='shrink-0 px-4 py-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 text-emerald-200 font-mono-data text-xs flex items-center gap-1.5 hover:bg-emerald-400/20 hover:border-emerald-300 transition disabled:opacity-50'
                    >
                      <Check size={13} />
                      {acking === a.id ? '...' : t('alerts.ackBtn')}
                    </button>
                  ) : (
                    <span className='shrink-0 label-tech'>resolved</span>
                  )}
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className='py-12 text-center text-dim'>
              <CheckCheck size={22} className='mx-auto mb-2 text-emerald-300' />
              {t('alerts.empty')}
            </li>
          )}
        </ul>
      </Panel>
    </div>
  );
}
