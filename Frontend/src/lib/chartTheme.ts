import type { Theme } from '../hooks/useTheme';

export type ChartPalette = {
  axis: string;
  grid: string;
  axisLine: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  cyan: string;
  violet: string;
  blueSoft: string;
  greenSoft: string;
  green: string;
  amber: string;
  rose: string;
  dotFill: string;
  cursorCyan: string;
  cursorViolet: string;
  cursorAmber: string;
};

const CHART_DARK: ChartPalette = {
  axis: '#41507f',
  grid: 'rgba(120,160,255,0.09)',
  axisLine: 'rgba(120,165,250,0.25)',
  tooltipBg: 'rgba(8,12,26,0.96)',
  tooltipBorder: 'rgba(120,160,255,0.25)',
  tooltipText: '#dbe4ff',
  cyan: '#22d3ee',
  violet: '#a78bfa',
  blueSoft: 'rgba(96,165,250,0.55)',
  greenSoft: 'rgba(52,211,153,0.85)',
  green: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  dotFill: '#04060d',
  cursorCyan: 'rgba(34,211,238,0.07)',
  cursorViolet: 'rgba(167,139,250,0.08)',
  cursorAmber: 'rgba(251,191,36,0.07)',
};

const CHART_LIGHT: ChartPalette = {
  axis: '#5b6a94',
  grid: 'rgba(40,80,160,0.12)',
  axisLine: 'rgba(40,80,160,0.28)',
  tooltipBg: 'rgba(255,255,255,0.98)',
  tooltipBorder: 'rgba(40,80,160,0.22)',
  tooltipText: '#16203c',
  cyan: '#0891b2',
  violet: '#7c3aed',
  blueSoft: 'rgba(37,99,235,0.55)',
  greenSoft: 'rgba(5,150,105,0.85)',
  green: '#059669',
  amber: '#d97706',
  rose: '#e11d48',
  dotFill: '#ffffff',
  cursorCyan: 'rgba(8,145,178,0.08)',
  cursorViolet: 'rgba(124,58,237,0.08)',
  cursorAmber: 'rgba(217,119,6,0.08)',
};

export function chartPalette(theme: Theme): ChartPalette {
  return theme === 'light' ? CHART_LIGHT : CHART_DARK;
}

export function axisStyle(p: ChartPalette) {
  return { stroke: p.axis, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' };
}

export function tooltipStyle(p: ChartPalette) {
  return {
    background: p.tooltipBg,
    border: `1px solid ${p.tooltipBorder}`,
    borderRadius: 10,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 12,
    color: p.tooltipText,
  };
}
