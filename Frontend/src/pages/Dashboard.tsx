import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BedDouble,
  Building2,
  FlaskConical,
  RefreshCw,
  Radio,
  ServerCog,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Panel } from '../components/ui/Panel';
import { MetricTile } from '../components/ui/MetricTile';
import { api } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useTheme } from '../hooks/useTheme';
import { axisStyle, chartPalette, tooltipStyle } from '../lib/chartTheme';
import { cn } from '../lib/utils';
import type { Alert, Center, Beds, Doctors, TestItem } from '../types/domain';

type DistrictKpis = {
  centers: number;
  activeFlags: number;
  stockRisk: number;
  bedOccupancyPct: number;
  attendancePct: number;
  testAvailabilityPct: number;
  openWarnings: number;
};

type WarningRow = {
  centerId: string;
  medicineId: string;
  medicineName: string;
  severity: 'low' | 'med' | 'high' | 'critical';
  daysOfStock: number;
  qtyOnHand: number;
  reason: string;
  suggestedAction: string;
};

type FlagRow = {
  centerId: string;
  centerName: string;
  type: string;
  score: number;
  reasons: string[];
  interventions: string[];
  status: 'med' | 'high' | 'critical';
};

type RedistributionRow = {
  fromCenter: string;
  toCenter: string;
  medicineName: string;
  qty: number;
  unit: string;
  feasibility: string;
  reason: string;
};

type ForecastRow = {
  centerId: string;
  medicineId: string;
  medicineName: string;
  days: number;
  qtyForecast: number;
  confidence: 'low' | 'med' | 'high';
  rationale: string;
};

type FootfallRow = { centerId: string; date: string; hour: number; count: number };

const sevChip: Record<string, string> = {
  critical: 'chip-critical',
  high: 'chip-high',
  med: 'chip-med',
  low: 'chip-low',
};

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const chart = chartPalette(theme);
  const AXIS = axisStyle(chart);
  const tooltip = tooltipStyle(chart);

  const [kpis, setKpis] = useState<DistrictKpis | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [warnings, setWarnings] = useState<WarningRow[]>([]);
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [redistribution, setRedistribution] = useState<RedistributionRow[]>([]);
  const [forecast, setForecast] = useState<ForecastRow[]>([]);
  const [footfall, setFootfall] = useState<FootfallRow[]>([]);
  const [beds, setBeds] = useState<Beds[]>([]);
  const [doctors, setDoctors] = useState<Doctors[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [lastSync, setLastSync] = useState(() => new Date());
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([
      api.get<DistrictKpis>('/api/district/kpis'),
      api.get<Center[]>('/api/centers'),
      api.get<Alert[]>('/api/alerts?status=open'),
      api.get<WarningRow[]>('/api/ai/warnings'),
      api.get<FlagRow[]>('/api/ai/flags'),
      api.get<RedistributionRow[]>('/api/ai/redistribution'),
      api.get<ForecastRow[]>('/api/ai/forecast?days=7'),
      api.get<FootfallRow[]>('/api/footfall'),
      api.get<Beds[]>('/api/beds'),
      api.get<Doctors[]>('/api/attendance'),
      api.get<TestItem[]>('/api/tests'),
    ])
      .then(
        ([k, c, a, w, f, r, fc, ff, b, d, ti]) => {
          setKpis(k);
          setCenters(c);
          setAlerts(a);
          setWarnings(w);
          setFlags(f);
          setRedistribution(r);
          setForecast(fc);
          setFootfall(ff);
          setBeds(b);
          setDoctors(d);
          setTests(ti);
          setLastSync(new Date());
          setFailed(false);
        },
        () => setFailed(true),
      );
  }, []);

  const { enabled: autoOn, setEnabled: setAutoOn } = useAutoRefresh(refresh, 30000);
  useEffect(() => {
    refresh();
  }, [refresh]);

  /* ---------- chart 1: 7-day footfall ---------- */
  const footfallSeries = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const row of footfall) byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.count);
    return [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [footfall]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const sys = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (footfall.some((f) => f.date === sys)) return sys;
    return footfall.reduce((latest, f) => (f.date > latest ? f.date : latest), '');
  }, [footfall]);

  /* ---------- chart 2: hourly footfall ---------- */
  const hourlySeries = useMemo(() => {
    const byHour = new Map<number, number>();
    for (const row of footfall) {
      if (row.date === todayStr) byHour.set(row.hour, (byHour.get(row.hour) ?? 0) + row.count);
    }
    return [...byHour.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));
  }, [footfall, todayStr]);

  const todayFootfall = useMemo(
    () => footfall.filter((f) => f.date === todayStr).reduce((a, f) => a + f.count, 0),
    [footfall, todayStr],
  );

  /* ---------- chart 3: beds by centre ---------- */
  const bedByCenter = useMemo(
    () =>
      beds.map((b) => {
        const c = centers.find((x) => x.id === b.centerId);
        return {
          name: c ? c.name.replace(/^(PHC|CHC)\s/, '') : b.centerId,
          occupied: b.occupied,
          available: b.available,
        };
      }),
    [beds, centers],
  );

  /* ---------- chart 4: attendance by centre ---------- */
  const attendanceByCenter = useMemo(
    () =>
      centers.map((c) => {
        const docs = doctors.filter((d) => d.centerId === c.id);
        const present = docs.reduce((a, d) => a + d.present.length, 0);
        const total = docs.reduce((a, d) => a + d.total, 0);
        return {
          name: c.name.replace(/^(PHC|CHC)\s/, ''),
          pct: total ? Math.round((present / total) * 100) : 100,
        };
      }),
    [centers, doctors],
  );

  /* ---------- chart 5: 7-day forecast ---------- */
  const forecastSeries = useMemo(() => {
    const agg = new Map<string, number>();
    for (const row of forecast) agg.set(row.medicineName, (agg.get(row.medicineName) ?? 0) + row.qtyForecast);
    return [...agg.entries()].map(([name, qty]) => ({ name, qty }));
  }, [forecast]);

  const centerRows = useMemo(() => {
    return centers.map((c) => {
      const b = beds.find((x) => x.centerId === c.id);
      const docs = doctors.filter((d) => d.centerId === c.id);
      const present = docs.reduce((a, d) => a + d.present.length, 0);
      const total = docs.reduce((a, d) => a + d.total, 0);
      const att = total ? Math.round((present / total) * 100) : 100;
      const occ = b && b.total ? Math.round(((b.total - b.available) / b.total) * 100) : 0;
      const wcount = warnings.filter((w) => w.centerId === c.id).length;
      const flagged = flags.find((f) => f.centerId === c.id);
      return { c, occ, att, wcount, flagged };
    });
  }, [centers, beds, doctors, warnings, flags]);

  const now = lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className='space-y-5'>
      {/* ============ HERO ============ */}
      <div className='panel relative overflow-hidden p-5 md:p-6 rise'>
        <div className='scanline' />
        <div className='relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='min-w-0'>
            <div className='label-tech flex items-center gap-2 mb-2'>
              <span className='pulse-dot' />
              DISTRICT COMMAND · LIVE TELEMETRY
            </div>
            <h1 className='font-display text-2xl sm:text-3xl font-extrabold grad-cyan'>{t('dashboard.heroTitle')}</h1>
            <p className='text-dim mt-1.5 text-sm max-w-2xl'>{t('dashboard.heroSub')}</p>
          </div>
          <div className='flex flex-wrap items-center gap-2.5'>
            <div className='panel px-3 py-2 flex items-center gap-2 !rounded-lg'>
              <Radio size={14} className='text-emerald-300' />
              <span className='font-mono-data text-xs text-emerald-300'>
                {failed ? 'LINK DOWN' : 'SYNCED'} {now}
              </span>
            </div>
            <button
              onClick={() => setAutoOn(!autoOn)}
              className={cn('panel px-3 py-2 flex items-center gap-2 !rounded-lg font-mono-data text-xs transition', autoOn ? 'glow-cyan text-cyan-200' : 'text-dim')}
              aria-pressed={autoOn}
            >
              <RefreshCw size={14} className={autoOn ? 'animate-spin-slow' : ''} /> AUTO {autoOn ? 'ON' : 'OFF'}
            </button>
            <button onClick={refresh} className='panel px-3 py-2 flex items-center gap-2 !rounded-lg font-mono-data text-xs text-[var(--text)] hover:glow-violet transition'>
              <Zap size={14} className='text-amber-300' /> SYNC
            </button>
          </div>
        </div>

        <div className='relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mt-5'>
          <MetricTile label={t('dashboard.kpiCenters')} value={kpis?.centers ?? '—'} tone='blue' icon={<Building2 size={16} />}
            sub={`${centers.filter((c) => c.type === 'CHC').length} CHC · ${centers.filter((c) => c.type === 'PHC').length} PHC`} />
          <MetricTile label={t('dashboard.kpiStockRisk')} value={kpis?.stockRisk ?? '—'} tone='rose' icon={<AlertTriangle size={16} />}
            sub={`${warnings.length} active warnings`} progress={kpis ? Math.min(100, kpis.stockRisk * 12) : 0} />
          <MetricTile label={t('dashboard.kpiBedOccupancy')} value={kpis?.bedOccupancyPct ?? '—'} unit='%' tone='amber' icon={<BedDouble size={16} />}
            sub={`${beds.reduce((a, b) => a + b.available, 0)} beds free`} progress={kpis?.bedOccupancyPct ?? 0} />
          <MetricTile label={t('dashboard.kpiAttendance')} value={kpis?.attendancePct ?? '—'} unit='%' tone='green' icon={<UserCheck size={16} />}
            sub='district on-duty rate' progress={kpis?.attendancePct ?? 0} />
          <MetricTile label={t('dashboard.kpiTestAvail')} value={kpis?.testAvailabilityPct ?? '—'} unit='%' tone='cyan' icon={<FlaskConical size={16} />}
            sub={`${tests.filter((x) => !x.available).length} labs down`} progress={kpis?.testAvailabilityPct ?? 0} />
          <MetricTile label={t('dashboard.kpiFlags')} value={kpis?.activeFlags ?? '—'} tone='violet' icon={<ServerCog size={16} />}
            sub='centres flagged for review' />
        </div>
      </div>

      {/* ============ CHARTS ROW 1 : footfall + hourly ============ */}
      <div className='grid gap-5 xl:grid-cols-3'>
        <Panel
          className='xl:col-span-2'
          tone='cyan'
          kicker='chart 01 / patient flow'
          title={t('dashboard.footfallTrend')}
          action={<span className='chip chip-info'>TODAY {todayFootfall}</span>}
        >
          <div className='h-56 md:h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={footfallSeries} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id='ffGrad' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor={chart.cyan} stopOpacity={0.55} />
                    <stop offset='100%' stopColor={chart.cyan} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chart.grid} strokeDasharray='3 4' />
                <XAxis dataKey='date' tick={AXIS} tickLine={false} axisLine={{ stroke: chart.axisLine }} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltip} cursor={{ stroke: chart.cyan, strokeDasharray: '4 4' }} />
                <Area type='monotone' dataKey='count' name='visits' stroke={chart.cyan} strokeWidth={2.5} fill='url(#ffGrad)'
                  dot={{ r: 3, fill: chart.dotFill, stroke: chart.cyan, strokeWidth: 2 }}
                  activeDot={{ r: 5, stroke: chart.violet, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className='grid grid-cols-3 gap-3 mt-4'>
            {[
              { l: 'TODAY', v: footfallSeries.at(-1)?.count ?? 0, c: 'text-cyan-300' },
              { l: 'YESTERDAY', v: footfallSeries.at(-2)?.count ?? 0, c: 'text-blue-300' },
              { l: 'PEAK 7D', v: Math.max(...footfallSeries.map((x) => x.count), 0), c: 'text-violet-300' },
            ].map((x) => (
              <div key={x.l} className='rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2'>
                <div className='label-tech'>{x.l}</div>
                <div className={cn('font-mono-data text-lg font-bold', x.c)}>{x.v}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel tone='violet' kicker='chart 02 / intraday load' title={t('dashboard.hourlyFootfall')}>
          <div className='h-56 md:h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={hourlySeries} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke={chart.grid} strokeDasharray='3 4' vertical={false} />
                <XAxis dataKey='hour' tick={AXIS} tickLine={false} axisLine={{ stroke: chart.axisLine }} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltip} cursor={{ fill: chart.cursorViolet }} />
                <Bar dataKey='count' name='visits' radius={[5, 5, 0, 0]}>
                  {hourlySeries.map((_, i) => (
                    <Cell key={i} fill={i === hourlySeries.length - 1 ? chart.violet : chart.blueSoft} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className='text-dim text-xs mt-3 leading-relaxed'>
            <span className='text-violet-300 font-semibold'>AI:</span> peak load 09:00–11:00 — stagger OPD slots.
          </p>
        </Panel>
      </div>

      {/* ============ CHARTS ROW 2 : beds + attendance + forecast ============ */}
      <div className='grid gap-5 lg:grid-cols-3'>
        <Panel tone='amber' kicker='chart 03 / capacity' title={t('dashboard.bedsTitle')}>
          <div className='h-52'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={bedByCenter} layout='vertical' margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={chart.grid} strokeDasharray='3 4' horizontal={false} />
                <XAxis type='number' tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis type='category' dataKey='name' width={84} tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltip} cursor={{ fill: chart.cursorAmber }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: chart.tooltipText }} />
                <Bar dataKey='occupied' name='occupied' stackId='a' fill={chart.amber} />
                <Bar dataKey='available' name='free' stackId='a' fill={chart.greenSoft} radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel tone='cyan' kicker='chart 04 / workforce' title={t('dashboard.attendanceTitle')}>
          <div className='h-52'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={attendanceByCenter} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={chart.grid} strokeDasharray='3 4' vertical={false} />
                <XAxis dataKey='name' tick={AXIS} tickLine={false} axisLine={{ stroke: chart.axisLine }} />
                <YAxis domain={[0, 100]} unit='%' tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltip} cursor={{ fill: chart.cursorCyan }} />
                <Bar dataKey='pct' name='attendance %' radius={[5, 5, 0, 0]} maxBarSize={34}>
                  {attendanceByCenter.map((r, i) => (
                    <Cell key={i} fill={r.pct >= 80 ? chart.green : r.pct >= 60 ? chart.amber : chart.rose} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel tone='rose' kicker='chart 05 / ai forecast' title={t('dashboard.forecastTitle')}
          action={<Link to='/analytics' className='chip chip-info hover:brightness-125 transition'>AI LAB</Link>}>
          <div className='h-52'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={forecastSeries} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={chart.grid} strokeDasharray='3 4' />
                <XAxis dataKey='name' tick={AXIS} tickLine={false} axisLine={{ stroke: chart.axisLine }} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltip} />
                <Line type='monotone' dataKey='qty' name='7-day demand' stroke={chart.cyan} strokeWidth={2.5}
                  dot={{ r: 3, fill: chart.dotFill, stroke: chart.cyan, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* ============ WARNINGS + FLAGS + ALERTS ============ */}
      <div className='grid gap-5 xl:grid-cols-3'>
        <Panel
          tone='rose'
          kicker='ai / early warning'
          title={t('dashboard.stockWarnings')}
          action={<Link to='/analytics' className='chip chip-critical hover:brightness-125 transition'>{warnings.length} OPEN</Link>}
        >
          <ul className='space-y-2.5 max-h-80 overflow-y-auto pr-1'>
            {warnings.length === 0 && <li className='text-dim text-sm py-6 text-center'>All clear.</li>}
            {warnings.slice(0, 8).map((w, i) => (
              <li key={`${w.centerId}-${w.medicineId}-${i}`} className='rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3'>
                <div className='flex items-center justify-between gap-2 mb-1.5'>
                  <span className='font-semibold text-sm text-[var(--text)] truncate'>{w.medicineName}</span>
                  <span className={cn('chip', sevChip[w.severity])}>{w.severity}</span>
                </div>
                <div className='flex items-center gap-2 text-xs font-mono-data mb-2'>
                  <span className='text-cyan-300'>{w.centerId.toUpperCase()}</span>
                  <span className='text-amber-300'>{w.daysOfStock}d cover</span>
                </div>
                <div className='meter crit'>
                  <span style={{ width: `${Math.min(100, (w.daysOfStock / 5) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          tone='amber'
          kicker='event stream'
          title={t('dashboard.alerts')}
          action={<Link to='/alerts' className='chip chip-high hover:brightness-125 transition'>{alerts.length} OPEN</Link>}
        >
          <ul className='space-y-2.5 max-h-80 overflow-y-auto pr-1'>
            {alerts.length === 0 && <li className='text-dim text-sm py-6 text-center'>No open alerts.</li>}
            {alerts.map((a) => (
              <li key={a.id} className={cn('rounded-lg border p-3 border-l-[3px]',
                a.severity === 'critical' ? 'border-l-rose-500 border-rose-500/25 bg-rose-500/[0.05]'
                  : a.severity === 'high' ? 'border-l-orange-400 border-orange-400/25 bg-orange-400/[0.05]'
                    : 'border-l-amber-300 border-amber-300/25 bg-amber-300/[0.05]')}>
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-sm font-semibold text-[var(--text)]'>{a.message}</span>
                  <span className={cn('chip', sevChip[a.severity])}>{a.severity}</span>
                </div>
                <div className='flex items-center gap-2 mt-1.5 text-xs font-mono-data text-dim'>
                  <span>{a.centerId.toUpperCase()}</span>
                  <span className='ml-auto uppercase text-amber-300'>{a.type.replace(/_/g, ' ')}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          tone='rose'
          kicker='admin intervention'
          title={t('dashboard.aiFlags')}
          action={<Link to='/analytics' className='chip chip-critical hover:brightness-125 transition'>{flags.length} FLAGGED</Link>}
        >
          <ul className='space-y-3 max-h-80 overflow-y-auto pr-1'>
            {flags.length === 0 && <li className='text-dim text-sm py-6 text-center'>No underperforming centres.</li>}
            {flags.map((f) => (
              <li key={f.centerId} className='rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3'>
                <div className='flex items-center justify-between gap-2 mb-1'>
                  <span className='font-semibold text-sm truncate text-[var(--text)]'>{f.centerName}</span>
                  <span className={cn('chip', sevChip[f.status])}>{f.status}</span>
                </div>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='meter flex-1'>
                    <span style={{ width: `${f.score * 100}%` }}
                      className={f.score >= 0.5 ? '!bg-gradient-to-r !from-rose-400 !to-orange-400' : ''} />
                  </div>
                  <span className='font-mono-data text-xs text-rose-300 font-bold'>{f.score.toFixed(2)}</span>
                </div>
                <ul className='text-xs space-y-1'>
                  {f.reasons.map((r, i) => (
                    <li key={i} className='text-dim'>• {r}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* ============ CENTRE MATRIX + REDISTRIBUTION ============ */}
      <div className='grid gap-5 xl:grid-cols-3'>
        <Panel
          className='xl:col-span-2'
          tone='cyan'
          kicker='facility matrix'
          title={t('dashboard.centerStatus')}
          action={<span className='chip chip-info'>{centers.length} SITES</span>}
        >
          <div className='overflow-x-auto -mx-1 px-1'>
            <table className='w-full text-xs min-w-[460px]'>
              <thead>
                <tr className='label-tech text-left'>
                  <th className='pb-2 pr-2'>centre</th>
                  <th className='pb-2 pr-2'>beds</th>
                  <th className='pb-2 pr-2'>att.</th>
                  <th className='pb-2 pr-2'>warn</th>
                  <th className='pb-2'>state</th>
                </tr>
              </thead>
              <tbody className='font-mono-data'>
                {centerRows.map((r) => (
                  <tr
                    key={r.c.id}
                    onClick={() => navigate(`/centers/${r.c.id}`)}
                    className='border-t border-[var(--line)] hover:bg-[var(--surface)] transition cursor-pointer'
                  >
                    <td className='py-2.5 pr-2'>
                      <div className='text-[var(--text)] font-semibold truncate max-w-[140px]'>{r.c.name}</div>
                      <div className='label-tech !text-[0.5rem]'>{r.c.type}</div>
                    </td>
                    <td className='py-2.5 pr-2'>
                      <div className={r.occ >= 85 ? 'text-rose-300' : 'text-amber-300'}>{r.occ}%</div>
                      <div className={cn('meter w-12 mt-1', r.occ >= 85 ? 'crit' : 'warn')}>
                        <span style={{ width: `${r.occ}%` }} />
                      </div>
                    </td>
                    <td className={cn('py-2.5 pr-2', r.att >= 80 ? 'text-emerald-300' : r.att >= 60 ? 'text-amber-300' : 'text-rose-300')}>
                      {r.att}%
                    </td>
                    <td className='py-2.5 pr-2'>
                      {r.wcount > 0 ? <span className='chip chip-critical'>{r.wcount}</span> : <span className='chip chip-ok'>0</span>}
                    </td>
                    <td className='py-2.5'>
                      {r.flagged ? (
                        <span className={cn('chip', sevChip[r.flagged.status])}>flag</span>
                      ) : (
                        <span className='chip chip-ok'>ok</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          tone='violet'
          kicker='ai / smart redistribution'
          title={t('dashboard.redistributionTitle')}
          action={<Link to='/analytics' className='chip chip-info hover:brightness-125 transition'>OPEN</Link>}
        >
          <ul className='space-y-2.5 max-h-72 overflow-y-auto pr-1'>
            {redistribution.length === 0 && <li className='text-dim text-sm py-6 text-center'>No transfers needed.</li>}
            {redistribution.slice(0, 5).map((r, i) => (
              <li key={i} className='rounded-lg border border-violet-400/25 bg-violet-400/[0.06] p-3'>
                <div className='flex items-center justify-between gap-2 mb-1.5'>
                  <span className='text-xs font-semibold text-violet-200 truncate'>{r.medicineName}</span>
                  <span className='chip chip-ok shrink-0'>{r.feasibility}</span>
                </div>
                <div className='flex items-center gap-1.5 text-[0.65rem] font-mono-data mb-1.5'>
                  <span className='px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-400/30'>
                    {r.fromCenter.toUpperCase()}
                  </span>
                  <span className='text-violet-300'>→</span>
                  <span className='px-1.5 py-0.5 rounded bg-rose-400/10 text-rose-300 border border-rose-400/30'>
                    {r.toCenter.toUpperCase()}
                  </span>
                  <span className='ml-auto text-amber-300 font-bold'>
                    {r.qty} {r.unit}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <p className='text-center label-tech pb-2'>
        SMART HEALTH · AI PLATFORM · {t('dashboard.lastSync')} {now}
      </p>
    </div>
  );
}
