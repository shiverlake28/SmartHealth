import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarCheck, CheckCircle2, Timer, UserCheck, UserX } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { MetricTile } from '../components/ui/MetricTile';
import { api } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useTheme } from '../hooks/useTheme';
import { axisStyle, chartPalette, tooltipStyle } from '../lib/chartTheme';
import { cn } from '../lib/utils';

type AttRow = {
  centerId: string;
  centerName: string;
  centerType: string;
  date: string;
  shift: string;
  present: string[];
  absent: string[];
  total: number;
  presentCount: number;
  absentCount: number;
  attendancePct: number;
  status: 'ok' | 'med' | 'critical';
};

type Summary = {
  present: number;
  absent: number;
  total: number;
  attendancePct: number;
  shifts: string[];
  compliantShifts: number;
  totalShifts: number;
};

type Center = { id: string; name: string };

const chipCls: Record<AttRow['status'], string> = { ok: 'chip-ok', med: 'chip-med', critical: 'chip-critical' };

export default function Attendance() {
  const { t } = useTranslation();
  const theme = useTheme();
  const chart = chartPalette(theme);
  const AXIS = axisStyle(chart);
  const tooltip = tooltipStyle(chart);
  const [rows, setRows] = useState<AttRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [centerFilter, setCenterFilter] = useState('all');
  const [lastSync, setLastSync] = useState(() => new Date());

  const refresh = useCallback(() => {
    Promise.all([
      api.get<AttRow[]>('/api/attendance'),
      api.get<Summary>('/api/attendance/summary'),
      api.get<Center[]>('/api/centers'),
    ])
      .then(([r, s, c]) => {
        setRows(r);
        setSummary(s);
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
    () => (centerFilter === 'all' ? rows : rows.filter((r) => r.centerId === centerFilter)),
    [rows, centerFilter],
  );

  const chartData = useMemo(
    () =>
      filtered.map((r) => ({
        name: r.centerName.replace(/^(PHC|CHC)\s/, ''),
        pct: r.attendancePct,
        present: r.presentCount,
        absent: r.absentCount,
      })),
    [filtered],
  );

  return (
    <div className='space-y-5'>
      {/* header + KPIs */}
      <div className='panel p-4 md:p-5 rise'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <div className='label-tech mb-1'>workforce / duty compliance</div>
            <h1 className='font-display text-xl md:text-2xl font-bold grad-cyan'>{t('attendance.title')}</h1>
            <p className='text-dim text-sm mt-1'>{t('attendance.sub')}</p>
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
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className='px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-cyan-400/60 font-mono-data'
            >
              <option value='all'>{t('inventory.allCentres')}</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mt-4'>
          <MetricTile
            label={t('attendance.kpiPct')}
            value={summary?.attendancePct ?? '—'}
            unit='%'
            tone={summary && summary.attendancePct >= 80 ? 'green' : 'amber'}
            icon={<UserCheck size={16} />}
            sub='district-wide on-duty rate'
            progress={summary?.attendancePct ?? 0}
          />
          <MetricTile
            label={t('attendance.kpiPresent')}
            value={summary?.present ?? '—'}
            tone='cyan'
            icon={<CheckCircle2 size={16} />}
            sub={`of ${summary?.total ?? 0} posted doctors`}
          />
          <MetricTile
            label={t('attendance.kpiAbsent')}
            value={summary?.absent ?? '—'}
            tone='rose'
            icon={<UserX size={16} />}
            sub='missing from duty today'
            progress={summary && summary.total ? (summary.absent / summary.total) * 100 : 0}
          />
          <MetricTile
            label={t('attendance.kpiShifts')}
            value={`${summary?.compliantShifts ?? 0}/${summary?.totalShifts ?? 0}`}
            tone='violet'
            icon={<CalendarCheck size={16} />}
            sub='shifts meeting 80% target'
            progress={summary && summary.totalShifts ? (summary.compliantShifts / summary.totalShifts) * 100 : 0}
          />
        </div>
      </div>

      <div className='grid gap-5 xl:grid-cols-3'>
        {/* chart */}
        <Panel
          className='xl:col-span-2'
          tone='cyan'
          kicker='compliance by centre'
          title={t('attendance.chartTitle')}
          action={<span className='chip chip-info'><Timer size={11} /> TODAY</span>}
        >
          <div className='h-64 md:h-72'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={chartData} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={chart.grid} strokeDasharray='3 4' vertical={false} />
                <XAxis dataKey='name' tick={AXIS} tickLine={false} axisLine={{ stroke: chart.axisLine }} />
                <YAxis domain={[0, 100]} unit='%' tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltip} cursor={{ fill: chart.cursorCyan }} />
                <Bar dataKey='pct' name='attendance %' radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {chartData.map((r, i) => (
                    <Cell key={i} fill={r.pct >= 80 ? chart.green : r.pct >= 60 ? chart.amber : chart.rose} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className='flex flex-wrap gap-3 mt-3 text-xs font-mono-data'>
            <span className='text-emerald-300'>■ ≥80% compliant</span>
            <span className='text-amber-300'>■ 60–79% watch</span>
            <span className='text-rose-300'>■ &lt;60% critical</span>
          </div>
        </Panel>

        {/* roster table */}
        <Panel
          tone='violet'
          kicker='duty roster'
          title={t('attendance.rosterTitle')}
          action={<span className='chip chip-info'>{filtered.length} SHIFTS</span>}
        >
          <ul className='space-y-2.5 max-h-[340px] overflow-y-auto pr-1'>
            {filtered.map((r, i) => (
              <li key={`${r.centerId}-${r.shift}-${i}`} className='rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 hover:border-violet-400/40 transition'>
                <div className='flex items-center justify-between gap-2 mb-1.5'>
                  <div className='min-w-0'>
                    <div className='text-sm font-semibold text-[var(--text)] truncate'>{r.centerName}</div>
                    <div className='label-tech !text-[0.55rem]'>{r.shift} · {r.date}</div>
                  </div>
                  <span className={cn('chip', chipCls[r.status])}>{r.attendancePct}%</span>
                </div>
                <div className='meter mb-2'>
                  <span
                    style={{ width: `${r.attendancePct}%` }}
                    className={r.status === 'critical' ? '!bg-gradient-to-r !from-rose-400 !to-orange-400' : r.status === 'med' ? '!bg-gradient-to-r !from-amber-400 !to-orange-400' : ''}
                  />
                </div>
                <div className='flex flex-wrap gap-1.5 text-[0.65rem] font-mono-data'>
                  {r.present.map((p) => (
                    <span key={p} className='px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-400/30'>
                      ✓ {p}
                    </span>
                  ))}
                  {r.absent.map((p) => (
                    <span key={p} className='px-1.5 py-0.5 rounded bg-rose-400/10 text-rose-300 border border-rose-400/30 line-through'>
                      ✗ {p}
                    </span>
                  ))}
                </div>
              </li>
            ))}
            {filtered.length === 0 && <li className='text-dim text-sm py-8 text-center'>{t('attendance.empty')}</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
