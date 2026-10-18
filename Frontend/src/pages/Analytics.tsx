import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BrainCircuit,
  ChevronRight,
  CornerDownRight,
  LineChart as LineChartIcon,
  Radar,
  Route,
  Sparkles,
} from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { MetricTile } from '../components/ui/MetricTile';
import { api } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { cn } from '../lib/utils';

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

type ForecastRow = {
  centerId: string;
  medicineId: string;
  medicineName: string;
  days: number;
  qtyForecast: number;
  confidence: 'low' | 'med' | 'high';
  rationale: string;
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

type FlagRow = {
  centerId: string;
  centerName: string;
  type: string;
  score: number;
  reasons: string[];
  interventions: string[];
  status: 'med' | 'high' | 'critical';
};

type Tab = 'warnings' | 'forecast' | 'redistribution' | 'flags';

const sevChip: Record<string, string> = {
  critical: 'chip-critical',
  high: 'chip-high',
  med: 'chip-med',
  low: 'chip-low',
};

const tabs: { id: Tab; label: string; icon: typeof Radar }[] = [
  { id: 'warnings', label: 'Early Warnings', icon: Radar },
  { id: 'forecast', label: 'Demand Forecast', icon: LineChartIcon },
  { id: 'redistribution', label: 'Redistribution', icon: Route },
  { id: 'flags', label: 'Underperformers', icon: BrainCircuit },
];

export default function Analytics() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('warnings');
  const [warnings, setWarnings] = useState<WarningRow[]>([]);
  const [f7, setF7] = useState<ForecastRow[]>([]);
  const [f30, setF30] = useState<ForecastRow[]>([]);
  const [redistribution, setRedistribution] = useState<RedistributionRow[]>([]);
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [horizon, setHorizon] = useState<7 | 30>(7);
  const [lastSync, setLastSync] = useState(() => new Date());

  const refresh = useCallback(() => {
    Promise.all([
      api.get<WarningRow[]>('/api/ai/warnings'),
      api.get<ForecastRow[]>('/api/ai/forecast?days=7'),
      api.get<ForecastRow[]>('/api/ai/forecast?days=30'),
      api.get<RedistributionRow[]>('/api/ai/redistribution'),
      api.get<FlagRow[]>('/api/ai/flags'),
    ]).then(([w, a, b, r, f]) => {
      setWarnings(w);
      setF7(a);
      setF30(b);
      setRedistribution(r);
      setFlags(f);
      setLastSync(new Date());
    });
  }, []);

  const { enabled: autoOn, setEnabled: setAutoOn } = useAutoRefresh(refresh, 30000);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const forecast = horizon === 7 ? f7 : f30;

  const forecastTotals = useMemo(() => {
    const byMed = new Map<string, number>();
    for (const r of forecast) byMed.set(r.medicineName, (byMed.get(r.medicineName) ?? 0) + r.qtyForecast);
    return [...byMed.entries()].sort((a, b) => b[1] - a[1]);
  }, [forecast]);

  const confidenceMix = useMemo(() => {
    const high = forecast.filter((f) => f.confidence === 'high').length;
    const med = forecast.filter((f) => f.confidence === 'med').length;
    const low = forecast.filter((f) => f.confidence === 'low').length;
    return { high, med, low, avg: forecast.length ? Math.round(((high + med * 0.6) / forecast.length) * 100) : 0 };
  }, [forecast]);

  return (
    <div className='space-y-5'>
      {/* header */}
      <div className='panel p-4 md:p-5 relative overflow-hidden rise'>
        <div className='scanline' />
        <div className='relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <div className='label-tech flex items-center gap-2 mb-1'>
              <Sparkles size={11} className='text-violet-300' />
              decision support / explainable ai
            </div>
            <h1 className='font-display text-xl md:text-2xl font-bold grad-cyan'>{t('ai.title')}</h1>
            <p className='text-dim text-sm mt-1 max-w-2xl'>{t('ai.sub')}</p>
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
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mt-4'>
          <MetricTile label='Warnings' value={warnings.length} tone='rose' icon={<Radar size={16} />} sub={`${warnings.filter((w) => w.severity === 'critical').length} critical`} />
          <MetricTile label='Forecast Lines' value={forecast.length} tone='cyan' icon={<LineChartIcon size={16} />} sub={`${horizon}-day horizon`} progress={confidenceMix.avg} />
          <MetricTile label='Transfer Routes' value={redistribution.length} tone='violet' icon={<Route size={16} />} sub='surplus → deficit suggestions' />
          <MetricTile label='Flagged Centres' value={flags.length} tone='amber' icon={<BrainCircuit size={16} />} sub='need district intervention' />
        </div>
      </div>

      {/* tabs */}
      <div className='flex gap-2 overflow-x-auto pb-1'>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'panel px-4 py-2.5 flex items-center gap-2 font-mono-data text-xs whitespace-nowrap transition',
              tab === id ? 'glow-cyan text-cyan-200 border-cyan-400/50' : 'text-dim hover:text-[#dbe4ff]',
            )}
          >
            <Icon size={14} />
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ============ WARNINGS ============ */}
      {tab === 'warnings' && (
        <Panel
          tone='rose'
          kicker='model: days-of-stock vs lead-time'
          title={t('ai.warningsTitle')}
          action={<span className='chip chip-critical'>{warnings.length} ACTIVE</span>}
        >
          <p className='text-xs text-dim mb-4 leading-relaxed border-l-2 border-rose-400/40 pl-3'>
            <span className='text-rose-300 font-semibold'>How it works:</span> for every stock line we compute{' '}
            <span className='font-mono-data text-cyan-300'>daysOfStock = qtyOnHand ÷ avgDailyConsumption(14d)</span> and
            compare against the supplier lead time. Falling below lead-time cover raises an early warning before the
            shelf actually empties.
          </p>
          <div className='grid gap-3 md:grid-cols-2'>
            {warnings.map((w, i) => (
              <div key={`${w.centerId}-${w.medicineId}-${i}`} className='rounded-lg border border-white/8 bg-white/[0.03] p-3.5 hover:border-rose-400/40 transition'>
                <div className='flex items-center justify-between gap-2 mb-2'>
                  <span className='font-semibold text-sm text-[#e6ecff]'>{w.medicineName}</span>
                  <span className={cn('chip', sevChip[w.severity])}>{w.severity}</span>
                </div>
                <div className='flex flex-wrap gap-2 text-xs font-mono-data mb-2.5'>
                  <span className='px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/30'>{w.centerId.toUpperCase()}</span>
                  <span className='px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30'>{w.daysOfStock}d cover</span>
                  <span className='px-2 py-0.5 rounded bg-white/5 text-[#9fb0dd] border border-white/10'>{w.qtyOnHand} on hand</span>
                </div>
                <div className='meter crit mb-2.5'>
                  <span style={{ width: `${Math.min(100, (w.daysOfStock / 5) * 100)}%` }} />
                </div>
                <p className='text-xs text-dim leading-relaxed'>{w.reason}</p>
                <p className='text-xs mt-1.5 text-emerald-300 flex items-start gap-1'>
                  <ChevronRight size={12} className='mt-0.5 shrink-0' />
                  {w.suggestedAction}
                </p>
              </div>
            ))}
            {warnings.length === 0 && <p className='text-dim text-sm py-8 text-center md:col-span-2'>{t('ai.empty')}</p>}
          </div>
        </Panel>
      )}

      {/* ============ FORECAST ============ */}
      {tab === 'forecast' && (
        <Panel
          tone='cyan'
          kicker='model: 14-day moving average + trend + 15% safety buffer'
          title={t('ai.forecastTitle')}
          action={
            <div className='flex gap-1.5'>
              {([7, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setHorizon(d)}
                  className={cn('chip transition', horizon === d ? 'chip-info' : 'chip-info opacity-40 hover:opacity-80')}
                >
                  {d}d
                </button>
              ))}
            </div>
          }
        >
          <p className='text-xs text-dim mb-4 leading-relaxed border-l-2 border-cyan-400/40 pl-3'>
            <span className='text-cyan-300 font-semibold'>How it works:</span> we blend the{' '}
            <span className='font-mono-data'>14-day average consumption</span> with today's issuance trend (clamped to
            ±30%), project it over the {horizon}-day horizon and add a <span className='font-mono-data'>15% safety
            buffer</span>. Confidence drops when the trend is volatile or the horizon is long.
          </p>

          <div className='grid gap-3 sm:grid-cols-3 mb-4'>
            <div className='rounded-lg border border-white/8 bg-white/[0.03] p-3'>
              <div className='label-tech'>confidence</div>
              <div className='font-display text-2xl font-bold grad-cyan'>{confidenceMix.avg}%</div>
            </div>
            <div className='rounded-lg border border-white/8 bg-white/[0.03] p-3'>
              <div className='label-tech'>high / med / low</div>
              <div className='font-mono-data text-sm mt-1'>
                <span className='text-emerald-300'>{confidenceMix.high}</span>
                <span className='text-dim'> / </span>
                <span className='text-amber-300'>{confidenceMix.med}</span>
                <span className='text-dim'> / </span>
                <span className='text-rose-300'>{confidenceMix.low}</span>
              </div>
            </div>
            <div className='rounded-lg border border-white/8 bg-white/[0.03] p-3'>
              <div className='label-tech'>total demand {horizon}d</div>
              <div className='font-display text-2xl font-bold grad-green'>
                {forecastTotals.reduce((a, [, v]) => a + v, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* demand bars */}
          <div className='space-y-2.5 mb-4'>
            {forecastTotals.map(([name, qty]) => {
              const max = forecastTotals[0]?.[1] || 1;
              return (
                <div key={name} className='flex items-center gap-3'>
                  <span className='text-xs w-28 shrink-0 truncate text-[#dbe4ff]'>{name}</span>
                  <div className='meter flex-1'>
                    <span style={{ width: `${(qty / max) * 100}%` }} />
                  </div>
                  <span className='font-mono-data text-xs text-cyan-300 w-16 text-right'>{qty.toLocaleString()}</span>
                </div>
              );
            })}
            {forecastTotals.length === 0 && <p className='text-dim text-sm py-6 text-center'>{t('ai.empty')}</p>}
          </div>

          {/* detail rows */}
          <ul className='space-y-2 max-h-64 overflow-y-auto pr-1'>
            {forecast.map((f, i) => (
              <li key={`${f.centerId}-${f.medicineId}-${i}`} className='flex flex-wrap items-center gap-2 rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2 text-xs'>
                <span className='text-[#e6ecff] font-semibold'>{f.medicineName}</span>
                <span className='font-mono-data text-cyan-300'>{f.centerId.toUpperCase()}</span>
                <span className='font-mono-data text-amber-300 font-bold'>→ {f.qtyForecast}</span>
                <span className={cn('chip ml-auto', f.confidence === 'high' ? 'chip-ok' : f.confidence === 'med' ? 'chip-med' : 'chip-high')}>
                  {f.confidence}
                </span>
                <span className='w-full text-dim !text-[0.65rem] font-mono-data'>{f.rationale}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ============ REDISTRIBUTION ============ */}
      {tab === 'redistribution' && (
        <Panel
          tone='violet'
          kicker='model: surplus → deficit within district'
          title={t('ai.redistributionTitle')}
          action={<span className='chip chip-info'>{redistribution.length} ROUTES</span>}
        >
          <p className='text-xs text-dim mb-4 leading-relaxed border-l-2 border-violet-400/40 pl-3'>
            <span className='text-violet-300'>How it works:</span> within each district, centres holding{' '}
            <span className='font-mono-data'>7+ days of buffer beyond reorder point</span> are treated as surplus;
            centres below <span className='font-mono-data'>lead-time cover</span> are deficits. The engine matches them
            medicine-by-medicine and proposes a transfer quantity that never strips the donor below 7 days of own stock.
          </p>
          <div className='grid gap-3 lg:grid-cols-2'>
            {redistribution.map((r, i) => (
              <div key={i} className='rounded-lg border border-violet-400/25 bg-violet-400/[0.06] p-4 hover:border-violet-300/50 transition'>
                <div className='flex items-center justify-between gap-2 mb-3'>
                  <span className='font-semibold text-sm text-violet-200'>{r.medicineName}</span>
                  <span className={cn('chip', r.feasibility === 'high' ? 'chip-ok' : 'chip-med')}>{r.feasibility} feasibility</span>
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-mono-data mb-3'>
                  <span className='px-2.5 py-1 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 text-center'>
                    ▲ {r.fromCenter.toUpperCase()} · donor
                  </span>
                  <CornerDownRight size={14} className='text-violet-300 mx-auto sm:mx-0 rotate-90 sm:rotate-0' />
                  <span className='px-2.5 py-1 rounded bg-rose-400/10 text-rose-300 border border-rose-400/30 text-center'>
                    ▼ {r.toCenter.toUpperCase()} · receiver
                  </span>
                  <span className='ml-auto text-amber-300 font-bold text-sm text-center sm:text-right'>
                    {r.qty} {r.unit}
                  </span>
                </div>
                <p className='text-xs text-dim leading-relaxed'>{r.reason}</p>
                <div className='mt-3 pt-2.5 border-t border-white/8 flex items-center justify-between'>
                  <span className='label-tech'>district</span>
                  <span className='font-mono-data text-xs text-[#dbe4ff]'>{r.district}</span>
                </div>
              </div>
            ))}
            {redistribution.length === 0 && <p className='text-dim text-sm py-8 text-center lg:col-span-2'>{t('ai.empty')}</p>}
          </div>
        </Panel>
      )}

      {/* ============ FLAGS ============ */}
      {tab === 'flags' && (
        <Panel
          tone='rose'
          kicker='model: weighted composite performance score'
          title={t('ai.flagsTitle')}
          action={<span className='chip chip-critical'>{flags.length} FLAGGED</span>}
        >
          <p className='text-xs text-dim mb-4 leading-relaxed border-l-2 border-rose-400/40 pl-3'>
            <span className='text-rose-300 font-semibold'>How it works:</span> each centre gets a 0–1 score from four
            weighted signals — <span className='font-mono-data'>stock-out risk ×0.40</span>,{' '}
            <span className='font-mono-data'>attendance ×0.25</span>,{' '}
            <span className='font-mono-data'>bed pressure ×0.20</span>,{' '}
            <span className='font-mono-data'>test availability ×0.15</span>. Scores ≥ 0.60 (or ≥2 active warnings) are
            auto-flagged to the district administrator with reasons and suggested interventions.
          </p>
          <div className='grid gap-3 md:grid-cols-2'>
            {flags.map((f) => (
              <div key={f.centerId} className='rounded-lg border border-white/8 bg-white/[0.03] p-4 hover:border-rose-400/40 transition'>
                <div className='flex items-center justify-between gap-2 mb-2'>
                  <div>
                    <div className='font-semibold text-sm text-[#e6ecff]'>{f.centerName}</div>
                    <div className='label-tech !text-[0.55rem]'>{f.type} · {f.centerId.toUpperCase()}</div>
                  </div>
                  <span className={cn('chip', sevChip[f.status])}>{f.status}</span>
                </div>
                <div className='flex items-center gap-2.5 mb-3'>
                  <span className='label-tech !mb-0'>score</span>
                  <div className='meter flex-1'>
                    <span
                      style={{ width: `${f.score * 100}%` }}
                      className={f.score >= 0.5 ? '!bg-gradient-to-r !from-rose-400 !to-orange-400' : ''}
                    />
                  </div>
                  <span className='font-mono-data text-sm text-rose-300 font-bold'>{f.score.toFixed(2)}</span>
                </div>
                <div className='mb-3'>
                  <div className='label-tech mb-1'>why flagged</div>
                  <ul className='text-xs space-y-1'>
                    {f.reasons.map((r, i) => (
                      <li key={i} className='text-dim flex gap-1.5'>
                        <span className='text-rose-300'>•</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className='pt-2.5 border-t border-white/8'>
                  <div className='label-tech mb-1'>recommended intervention</div>
                  {f.interventions.map((v, i) => (
                    <div key={i} className='text-xs text-emerald-300 flex gap-1.5'>
                      <ChevronRight size={12} className='mt-0.5 shrink-0' /> {v}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {flags.length === 0 && <p className='text-dim text-sm py-8 text-center md:col-span-2'>{t('ai.empty')}</p>}
          </div>
        </Panel>
      )}
    </div>
  );
}
