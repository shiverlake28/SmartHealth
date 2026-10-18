export type Warning = { centerId: string; medicineId: string; severity: 'low'|'med'|'high'|'critical'; daysOfStock: number; reason: string; suggestedAction: string; };

export function daysOfStock(qtyOnHand: number, avgDailyConsumption14d: number): number {
  if (!avgDailyConsumption14d || avgDailyConsumption14d <= 0) return Infinity;
  return qtyOnHand / avgDailyConsumption14d;
}

export function getWarnings(stock: Array<{centerId:string,medicineId:string,qtyOnHand:number,avgDailyConsumption14d:number}>, meds: Array<{id:string,reorderPoint:number,leadTimeDays:number,criticalMin:number}>, centers: Array<{id:string}>): Warning[] {
  const warnings: Warning[] = [];
  for (const s of stock) {
    const m = meds.find(mm => mm.id === s.medicineId);
    const c = centers.find(cc => cc.id === s.centerId);
    if (!m || !c) continue;
    const d = daysOfStock(s.qtyOnHand, s.avgDailyConsumption14d);
    if (d <= m.reorderPoint || d <= m.leadTimeDays * 0.8) {
      let sev: Warning['severity'] = 'med';
      if (d <= 1) sev = 'critical'; else if (d <= 2) sev = 'high';
      warnings.push({ centerId: s.centerId, medicineId: s.medicineId, severity: sev, daysOfStock: +d.toFixed(1), reason: 'Low days-of-stock vs reorder/lead', suggestedAction: 'Consider transfer or reorder' });
    }
  }
  return warnings;
}

