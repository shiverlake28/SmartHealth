import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  BedDouble,
  Building2,
  FlaskConical,
  Radio,
  RefreshCw,
  ServerCog,
  Stethoscope,
  Truck,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { MetricTile } from '../components/ui/MetricTile';
import { api } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { cn } from '../lib/utils';
import type { Alert, Center, Doctors, Beds, TestItem } from '../types/domain';

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
  avgDailyConsumption14d: number;
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
  district: string;
  fromCenter: string;
  toCenter: string;
  medicineId: string;
  medicineName: string;
  qty: number;
  unit: string;
  feasibility: 'high' | 'med' | 'low';
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

const AXIS = { stroke: '#41507f', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' };

const tooltipStyle = {
  background: 'rgba(8,12,26,0.96)',
  border: '1px solid rgba(120,160,255,0.25)',
  borderRadius: 10,
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12,
  color: '#dbe4ff',
};

function severityChip(s: string) {
  const cls =
    s === 'critical' ? 'chip-critical' : s === 'high' ? 'chip-high' : s === 'med' ? 'chip-med' : 'chip-low';
  return <span className={cn('chip', cls)}>{s}</span>;
}

export default function Dashboard() {
  const { t } = useTranslation();

  const [kpis, setKpis] = useState<DistrictKpis | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [warnings, setWarnings] = useState<WarningRow[]>([]);
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [redistribution, setRedistribution] = useState<RedistributionRow[]>([]);
  const [forecast7, setForecast7] = useState<ForecastRow[]>([]);
  const [forecast30, setForecast30] = useState<ForecastRow[]>([]);
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
      api.get<ForecastRow[]>('/api/ai/forecast?days=30'),
      api.get<FootfallRow[]>('/api/footfall'),
      api.get<Beds[]>('/api/beds'),
      api.get<Doctors[]>('/api/attendance'),
      api.get<TestItem[]>('/api/tests'),
    ])
      .then(
        ([k, c, a, w, f, r, f7, f30, ff, b, d, ti]) => {
          setKpis(k);
          setCenters(c);
          setAlerts(a);
          setWarnings(w);
          setFlags(f);
          setRedistribution(r);
          setForecast7(f7);
          setForecast30(f30);
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

  /* ---------- derived data ---------- */
  const footfallSeries = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const row of footfall) {
      byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.count);
    }
    return [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [footfall]);

  const hourlySeries = useMemo(() => {
    const byHour = new Map<number, number>();
    for (const row of footfall) {
      if (row.date === '2026-10-18') byHour.set(row.hour, (byHour.get(row.hour) ?? 0) + row.count);
    }
    return [...byHour.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));
  }, [footfall]);

  const forecastSeries = useMemo(() => {
    const agg = new Map<string, number>();
    for (const row of forecast7) agg.set(row.medicineName, (agg.get(row.medicineName) ?? 0) + row.qtyForecast);
    const agg30 = new Map<string, number>();
    for (const row of forecast30) agg30.set(row.medicineName, (agg30.get(row.medicineName) ?? 0) + row.qtyForecast);
    const names = new Set([...agg.keys(), ...agg30.keys()]);
    return [...names].map((name) => ({ name, d7: agg.get(name) ?? 0, d30: agg30.get(name) ?? 0 }));
  }, [forecast7, forecast30]);

  const bedByCenter = useMemo(
    () =>
      beds.map((b) => {
        const c = centers.find((x) => x.id === b.centerId);
        return {
          name: c ? c.name.replace(/^(PHC|CHC)\s/, '') : b.centerId,
          occupied: b.occupied,
          available: b.available,
          icu: b.icuOccupied,
        };
      }),
    [beds, centers],
  );

  const attendanceByCenter = useMemo(() => {
    const rows = centers.map((c) => {
      const docs = doctors.filter((d) => d.centerId === c.id);
      const present = docs.reduce((a, d) => a + d.present.length, 0);
      const total = docs.reduce((a, d) => a + d.total, 0);
      return {
        name: c.name.replace(/^(PHC|CHC)\s/, ''),
        pct: total ? Math.round((present / total) * 100) : 100,
        present,
        absent: total - present,
      };
    });
    return rows;
  }, [centers, doctors]);

  const testStatus = useMemo(() => {
    const ok = tests.filter((x) => x.available).length;
    const down = tests.length - ok;
    return [
      { name: 'Available', value: ok, fill: '#34d399' },
      { name: 'Down', value: down, fill: '#fb7185' },
    ].filter((x) => x.value > 0);
  }, [tests]);

  const centerRows = useMemo(() => {
    return centers.map((c) => {
      const b = beds.find((x) => x.centerId === c.id);
      const docs = doctors.filter((d) => d.centerId === c.id);
      const present = docs.reduce((a, d) => a + d.present.length, 0);
      const total = docs.reduce((a, d) => a + d.total, 0);
      const att = total ? Math.round((present / total) * 100) : 100;
      const cTests = tests.filter((x) => x.centerId === c.id);
      const tst = cTests.length ? Math.round((cTests.filter((x) => x.available).length / cTests.length) * 100) : 100;
      const occ = b && b.total ? Math.round(((b.total - b.available) / b.total) * 100) : 0;
      const wcount = warnings.filter((w) => w.centerId === c.id).length;
      const ff = footfall
        .filter((f) => f.centerId === c.id && f.date === '2026-10-18')
        .reduce((a, f) => a + f.count, 0);
      return { c, occ, att, tst, wcount, ff, bedsFree: b ? b.available : 0 };
    });
  }, [centers, beds, doctors, tests, warnings, footfall]);

  const criticalCount = warnings.filter((w) => w.severity === 'critical' || w.severity === 'high').length;

  const now = lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className='space-y-5'>
      {/* ============ HERO STRIP ============ */}
      <div className='panel relative overflow-hidden p-5 md:p-6 rise'>
        <div className='scanline' />
        <div className='relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='min-w-0'>
            <div className='label-tech flex items-center gap-2 mb-2'>
              <span className='pulse-dot' />
              DISTRICT COMMAND · LIVE TELEMETRY
            </div>
            <h1 className='font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold grad-cyan'>
              {t('dashboard.heroTitle')}
            </h1>
            <p className='text-dim mt-1.5 text-sm md:text-base max-w-2xl'>
              {t('dashboard.heroSub')}
            </p>
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
              className={cn(
                'panel px-3 py-2 flex items-center gap-2 !rounded-lg font-mono-data text-xs transition',
                autoOn ? 'glow-cyan text-cyan-200' : 'text-dim',
              )}
              aria-pressed={autoOn}
            >
              <RefreshCw size={14} className={autoOn ? 'animate-spin-slow' : ''} />
              AUTO {autoOn ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={refresh}
              className='panel px-3 py-2 flex items-center gap-2 !rounded-lg font-mono-data text-xs text-[#dbe4ff] hover:glow-violet transition'
            >
              <Zap size={14} className='text-amber-300' />
              FORCE SYNC
            </button>
          </div>
        </div>

        {/* metric row */}
        <div className='relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mt-5'>
          <MetricTile
            label={t('dashboard.kpiCenters')}
            value={kpis?.centers ?? '—'}
            tone='blue'
            icon={<Building2 size={16} />}
            sub={`${centers.filter((c) => c.type === 'CHC').length} CHC · ${centers.filter((c) => c.type === 'PHC').length} PHC`}
            delta='+1 new'
            deltaGood
          />
          <MetricTile
            label={t('dashboard.kpiStockRisk')}
            value={kpis?.stockRisk ?? '—'}
            tone='rose'
            icon={<AlertTriangle size={16} />}
            sub={`${criticalCount} critical warnings`}
            delta={kpis && kpis.stockRisk > 0 ? '▲ risk' : 'stable'}
            deltaGood={!(kpis && kpis.stockRisk > 0)}
            progress={kpis ? Math.min(100, kpis.stockRisk * 12) : 0}
          />
          <MetricTile
            label={t('dashboard.kpiBedOccupancy')}
            value={kpis?.bedOccupancyPct ?? '—'}
            unit='%'
            tone='amber'
            icon={<BedDouble size={16} />}
            sub={`${beds.reduce((a, b) => a + b.available, 0)} beds free district-wide`}
            progress={kpis?.bedOccupancyPct ?? 0}
          />
          <MetricTile
            label={t('dashboard.kpiAttendance')}
            value={kpis?.attendancePct ?? '—'}
            unit='%'
            tone='green'
            icon={<UserCheck size={16} />}
            sub={`${doctors.reduce((a, d) => a + d.present.length, 0)}/${doctors.reduce((a, d) => a + d.total, 0)} doctors on duty`}
            progress={kpis?.attendancePct ?? 0}
            delta={(kpis?.attendancePct ?? 0) >= 80 ? '▲ ok' : '▼ low'}
            deltaGood={(kpis?.attendancePct ?? 0) >= 80}
          />
          <MetricTile
            label={t('dashboard.kpiTestAvail')}
            value={kpis?.testAvailabilityPct ?? '—'}
            unit='%'
            tone='cyan'
            icon={<FlaskConical size={16} />}
            sub={`${tests.filter((x) => !x.available).map((x) => x.testType).join(', ') || 'all systems go'}`}
            progress={kpis?.testAvailabilityPct ?? 0}
          />
          <MetricTile
            label={t('dashboard.kpiFlags')}
            value={kpis?.activeFlags ?? '—'}
            tone='violet'
            icon={<ServerCog size={16} />}
            sub='underperforming centres flagged'
            spark={warnings.map((w) => w.daysOfStock).slice(0, 8)}
            delta={kpis && kpis.activeFlags > 0 ? 'review' : 'clear'}
            deltaGood={!(kpis && kpis.activeFlags > 0)}
          />
        </div>
      </div>

      {/* ============ CHART ROW 1 : footfall + forecast ============ */}
      <div className='grid gap-5 xl:grid-cols-3'>
        <Panel
          className='xl:col-span-2'
          tone='cyan'
          kicker='analytics / patient flow'
          title={t('dashboard.footfallTrend')}
          action={
            <span className='chip chip-info'>
              <Activity size={11} /> 7 DAYS
            </span>
          }
        >
          <div className='h-64 md:h-72'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={footfallSeries} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id='ffGrad' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='#22d3ee' stopOpacity={0.55} />
                    <stop offset='100%' stopColor='#22d3ee' stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke='rgba(120,160,255,0.09)' strokeDasharray='3 4' />
                <XAxis dataKey='date' tick={AXIS} tickLine={false} axisLine={{ stroke: 'rgba(120,160,255,0.2)' }} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#22d3ee', strokeDasharray: '4 4' }} />
                <Area
                  type='monotone'
                  dataKey='count'
                  name='visits'
                  stroke='#22d3ee'
                  strokeWidth={2.5}
                  fill='url(#ffGrad)'
                  dot={{ r: 3, fill: '#04060d', stroke: '#22d3ee', strokeWidth: 2 }}
                  activeDot={{ r: 5, stroke: '#a78bfa', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4'>
            {[
              { l: 'TODAY', v: footfallSeries.at(-1)?.count ?? 0, c: 'text-cyan-300' },
              { l: 'YESTERDAY', v: footfallSeries.at(-2)?.count ?? 0, c: 'text-blue-300' },
              { l: 'PEAK 7D', v: Math.max(...footfallSeries.map((x) => x.count), 0), c: 'text-violet-300' },
              { l: 'HOURLY NOW', v: hourlySeries.at(-1)?.count ?? 0, c: 'text-emerald-300' },
            ].map((x) => (
              <div key={x.l} className='rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2'>
                <div className='label-tech'>{x.l}</div>
                <div className={cn('font-mono-data text-xl font-bold', x.c)}>{x.v}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          tone='violet'
          kicker='ai / demand engine'
          title={t('dashboard.hourlyFootfall')}
          action={<span className='chip chip-info'>TODAY</span>}
        >
          <div className='h-52 md:h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={hourlySeries} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke='rgba(120,160,255,0.09)' strokeDasharray='3 4' vertical={false} />
                <XAxis dataKey='hour' tick={AXIS} tickLine={false} axisLine={{ stroke: 'rgba(120,165,250,0.25)' }} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(167,139,250,0.08)' }} />
                <Bar dataKey='count' name='visits' radius={[5, 5, 0, 0]}>
                  {hourlySeries.map((_, i) => (
                    <Cell key={i} fill={i === hourlySeries.length - 1 ? '#a78bfa' : 'rgba(96,165,250,0.55)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className='text-dim text-xs mt-3 leading-relaxed'>
            <span className='text-violet-300 font-semibold'>AI insight:</span> peak congestion detected between
            09:00–11:00. Consider staggered OPD slots to flatten the curve.
          </p>
        </Panel>
      </div>

      {/* ============ CHART ROW 2 : beds / attendance / tests ============ */}
      <div className='grid gap-5 lg:grid-cols-3'>
        <Panel tone='amber' kicker='resources / beds' title={t('dashboard.bedsTitle')}>
          <div className='h-56'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={bedByCenter} layout='vertical' margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid stroke='rgba(120,160,255,0.09)' strokeDasharray='3 4' horizontal={false} />
                <XAxis type='number' tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis type='category' dataKey='name' width={86} tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(251,191,36,0.07)' }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
                <Bar dataKey='occupied' name='occupied' stackId='a' fill='#fbbf24' radius={[0, 0, 0, 0]} />
                <Bar dataKey='available' name='free' stackId='a' fill='rgba(52,211,153,0.85)' radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel tone='cyan' kicker='workforce / attendance' title={t('dashboard.attendanceTitle')}>
          <div className='h-56'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={attendanceByCenter} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke='rgba(120,160,255,0.09)' strokeDasharray='3 4' vertical={false} />
                <XAxis dataKey='name' tick={AXIS} tickLine={false} axisLine={{ stroke: 'rgba(120,165,250,0.25)' }} />
                <YAxis domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} unit='%' />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(34,211,238,0.07)' }} />
                <Bar dataKey='pct' name='attendance %' radius={[5, 5, 0, 0]} maxBarSize={34}>
                  {attendanceByCenter.map((r, i) => (
                    <Cell key={i} fill={r.pct >= 80 ? '#34d399' : r.pct >= 60 ? '#fbbf24' : '#fb7185'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel tone='rose' kicker='diagnostics / test labs' title={t('dashboard.testsTitle')}>
          <div className='h-56 flex items-center justify-center'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={testStatus}
                  dataKey='value'
                  nameKey='name'
                  innerRadius='62%'
                  outerRadius='86%'
                  paddingAngle={4}
                  stroke='none'
                >
                  {testStatus.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className='text-center -mt-2'>
            <div className='font-display text-2xl font-bold grad-green'>{kpis?.testAvailabilityPct ?? '—'}%</div>
            <div className='label-tech'>district test uptime</div>
          </div>
        </Panel>
      </div>

      {/* ============ AI ENGINE ROW ============ */}
      <div className='grid gap-5 xl:grid-cols-3'>
        {/* Early warnings */}
        <Panel
          tone='rose'
          kicker='ai / early warning'
          title={t('dashboard.stockWarnings')}
          action={<span className='chip chip-critical'>{warnings.length} ACTIVE</span>}
          className='xl:col-span-1'
        >
          <ul className='space-y-2.5 max-h-80 overflow-y-auto pr-1'>
            {warnings.length === 0 && <li className='text-dim text-sm py-6 text-center'>All clear — no stock risks.</li>}
            {warnings.map((w, i) => (
              <li
                key={`${w.centerId}-${w.medicineId}-${i}`}
                className='rounded-lg border border-white/8 bg-white/[0.03] p-3 hover:border-cyan-400/40 transition'
              >
                <div className='flex items-center justify-between gap-2 mb-1.5'>
                  <span className='font-semibold text-sm text-[#e6ecff] truncate'>{w.medicineName}</span>
                  {severityChip(w.severity)}
                </div>
                <div className='flex items-center gap-2 text-xs text-dim mb-2'>
                  <span className='font-mono-data text-cyan-300'>{w.centerId.toUpperCase()}</span>
                  <span className='font-mono-data text-amber-300'>{w.daysOfStock}d cover</span>
                  <span className='font-mono-data'>{w.qtyOnHand} left</span>
                </div>
                <p className='text-xs text-dim leading-relaxed'>{w.reason}</p>
                <p className='text-xs mt-1 text-emerald-300'>→ {w.suggestedAction}</p>
                <div className='meter crit mt-2'>
                  <span style={{ width: `${Math.min(100, (w.daysOfStock / 5) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Forecast */}
        <Panel
          tone='cyan'
          kicker='ai / demand forecast'
          title={t('dashboard.forecastTitle')}
          action={
            <span className='chip chip-info'>
              <Stethoscope size={11} /> 7D vs 30D
            </span>
          }
        >
          <div className='h-56'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={forecastSeries} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid stroke='rgba(120,160,255,0.09)' strokeDasharray='3 4' />
                <XAxis dataKey='name' tick={AXIS} tickLine={false} axisLine={{ stroke: 'rgba(120,165,250,0.25)' }} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
                <Line type='monotone' dataKey='d7' name='7-day' stroke='#22d3ee' strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type='monotone' dataKey='d30' name='30-day' stroke='#a78bfa' strokeWidth={2.5} strokeDasharray='6 4' dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className='space-y-2 mt-3 max-h-32 overflow-y-auto pr-1'>
            {forecast7.slice(0, 4).map((f, i) => (
              <div key={i} className='flex items-center justify-between gap-2 text-xs border-t border-white/6 pt-2'>
                <span className='truncate text-[#dbe4ff]'>
                  {f.medicineName} <span className='text-dim'>· {f.centerId.toUpperCase()}</span>
                </span>
                <span className='font-mono-data text-cyan-300 shrink-0'>{f.qtyForecast}{f.qtyForecast ? '' : ''}</span>
                <span className={cn('chip', f.confidence === 'high' ? 'chip-ok' : f.confidence === 'med' ? 'chip-med' : 'chip-high')}>
                  {f.confidence}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Redistribution */}
        <Panel
          tone='violet'
          kicker='ai / smart redistribution'
          title={t('dashboard.redistributionTitle')}
          action={<span className='chip chip-info'>{redistribution.length} ROUTES</span>}
        >
          {redistribution.length === 0 ? (
            <p className='text-dim text-sm py-8 text-center'>No transfers required right now.</p>
          ) : (
            <ul className='space-y-3 max-h-80 overflow-y-auto pr-1'>
              {redistribution.map((r, i) => (
                <li key={i} className='rounded-lg border border-violet-400/25 bg-violet-400/[0.06] p-3'>
                  <div className='flex items-center justify-between gap-2 mb-2'>
                    <span className='font-semibold text-sm text-violet-200 truncate'>{r.medicineName}</span>
                    <span className={cn('chip', r.feasibility === 'high' ? 'chip-ok' : 'chip-med')}>
                      {r.feasibility} feas.
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-xs font-mono-data mb-2'>
                    <span className='px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-400/30'>
                      {r.fromCenter.toUpperCase()}
                    </span>
                    <span className='text-violet-300'>──{'>'}</span>
                    <span className='px-2 py-0.5 rounded bg-rose-400/10 text-rose-300 border border-rose-400/30'>
                      {r.toCenter.toUpperCase()}
                    </span>
                    <span className='ml-auto text-amber-300 font-bold'>
                      {r.qty} {r.unit}
                    </span>
                  </div>
                  <p className='text-xs text-dim leading-relaxed'>{r.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ============ FLAGS + ALERTS + CENTERS ============ */}
      <div className='grid gap-5 xl:grid-cols-3'>
        <Panel
          tone='rose'
          kicker='admin intervention'
          title={t('dashboard.aiFlags')}
          action={<span className='chip chip-critical'>{flags.length} FLAGGED</span>}
        >
          <ul className='space-y-3 max-h-96 overflow-y-auto pr-1'>
            {flags.length === 0 && <li className='text-dim text-sm py-6 text-center'>No underperforming centres.</li>}
            {flags.map((f) => (
              <li key={f.centerId} className='rounded-lg border border-white/8 bg-white/[0.03] p-3'>
                <div className='flex items-center justify-between gap-2 mb-1'>
                  <span className='font-semibold text-sm truncate text-[#e6ecff]'>{f.centerName}</span>
                  {severityChip(f.status)}
                </div>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='label-tech'>score</span>
                  <div className='meter flex-1'>
                    <span
                      style={{ width: `${f.score * 100}%` }}
                      className={f.score >= 0.8 ? '!bg-gradient-to-r !from-rose-400 !to-orange-400' : ''}
                    />
                  </div>
                  <span className='font-mono-data text-xs text-rose-300 font-bold'>{f.score.toFixed(2)}</span>
                </div>
                <ul className='text-xs space-y-1'>
                  {f.reasons.map((r, i) => (
                    <li key={i} className='text-dim'>• {r}</li>
                  ))}
                </ul>
                <div className='mt-2 pt-2 border-t border-white/6'>
                  <div className='label-tech mb-1'>intervention</div>
                  {f.interventions.map((v, i) => (
                    <div key={i} className='text-xs text-emerald-300'>→ {v}</div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          tone='amber'
          kicker='event stream'
          title={t('dashboard.alerts')}
          action={<span className='chip chip-high'>{alerts.length} OPEN</span>}
        >
          <ul className='space-y-2.5 max-h-96 overflow-y-auto pr-1'>
            {alerts.length === 0 && <li className='text-dim text-sm py-6 text-center'>No open alerts.</li>}
            {alerts.map((a) => (
              <li
                key={a.id}
                className={cn(
                  'rounded-lg border p-3 border-l-[3px]',
                  a.severity === 'critical'
                    ? 'border-l-rose-500 border-rose-500/25 bg-rose-500/[0.05]'
                    : a.severity === 'high'
                      ? 'border-l-orange-400 border-orange-400/25 bg-orange-400/[0.05]'
                      : 'border-l-amber-300 border-amber-300/25 bg-amber-300/[0.05]',
                )}
              >
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-sm font-semibold text-[#e6ecff]'>{a.message}</span>
                  {severityChip(a.severity)}
                </div>
                <div className='flex items-center gap-2 mt-1.5 text-xs font-mono-data text-dim'>
                  <span>{a.centerId.toUpperCase()}</span>
                  <span>·</span>
                  <span>{new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className='ml-auto uppercase text-amber-300'>{a.type.replace(/_/g, ' ')}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Center status table */}
        <Panel
          tone='cyan'
          kicker='facility matrix'
          title={t('dashboard.centerStatus')}
          action={
            <span className='chip chip-info'>
              <Truck size={11} /> {centers.length} SITES
            </span>
          }
        >
          <div className='overflow-x-auto -mx-1 px-1'>
            <table className='w-full text-xs'>
              <thead>
                <tr className='label-tech text-left'>
                  <th className='pb-2 pr-2'>centre</th>
                  <th className='pb-2 pr-2'>beds</th>
                  <th className='pb-2 pr-2'>att.</th>
                  <th className='pb-2 pr-2'>tests</th>
                  <th className='pb-2 pr-2'>warn</th>
                  <th className='pb-2'>flow</th>
                </tr>
              </thead>
              <tbody className='font-mono-data'>
                {centerRows.map((r) => (
                  <tr key={r.c.id} className='border-t border-white/6 hover:bg-white/[0.04] transition'>
                    <td className='py-2 pr-2'>
                      <div className='text-[#e6ecff] font-semibold truncate max-w-[92px]'>{r.c.name}</div>
                      <div className='label-tech'>{r.c.type}</div>
                    </td>
                    <td className='py-2 pr-2'>
                      <div className='text-amber-300'>{r.occ}%</div>
                      <div className='meter warn w-14 mt-1'>
                        <span style={{ width: `${r.occ}%` }} />
                      </div>
                    </td>
                    <td className='py-2 pr-2'>
                      <div className={r.att >= 80 ? 'text-emerald-300' : r.att >= 60 ? 'text-amber-300' : 'text-rose-300'}>
                        {r.att}%
                      </div>
                    </td>
                    <td className='py-2 pr-2'>
                      <div className={r.tst >= 100 ? 'text-emerald-300' : 'text-rose-300'}>{r.tst}%</div>
                    </td>
                    <td className='py-2 pr-2'>
                      {r.wcount > 0 ? (
                        <span className='chip chip-critical'>{r.wcount}</span>
                      ) : (
                        <span className='chip chip-ok'>0</span>
                      )}
                    </td>
                    <td className='py-2'>
                      <div className='text-cyan-300'>{r.ff}</div>
                      <div className='label-tech'>today</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <p className='text-center label-tech pb-2'>
        SMART HEALTH · AI PLATFORM · {t('dashboard.lastSync')} {now}
      </p>
    </div>
  );
}
