const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

const dataDir = path.join(__dirname, 'data')

function readJson(file) {
  try {
    const raw = fs.readFileSync(path.join(dataDir, file), 'utf8').replace(/^\uFEFF/, '')
    return JSON.parse(raw)
  } catch (e) {
    console.error('readJson failed', file, e.message)
    return []
  }
}

function daysOfStock(qty, avg) {
  if (!avg || avg <= 0) return Infinity
  return qty / avg
}

function warningSeverity(d) {
  if (d <= 1) return 'critical'
  if (d <= 2) return 'high'
  if (d <= 3) return 'med'
  return 'low'
}

function buildWarnings() {
  const centers = readJson('centers.json')
  const stock = readJson('stock.json')
  const meds = readJson('medicines.json')
  const warnings = []
  for (const s of stock) {
    const m = meds.find((mm) => mm.id === s.medicineId)
    const c = centers.find((cc) => cc.id === s.centerId)
    if (!m || !c) continue
    const d = daysOfStock(s.qtyOnHand, s.avgDailyConsumption14d)
    const early = d <= Math.max(m.leadTimeDays * 0.8, m.reorderPoint / Math.max(s.avgDailyConsumption14d, 1))
    if (d <= m.leadTimeDays || d <= m.reorderPoint / Math.max(s.avgDailyConsumption14d, 1) || early) {
      warnings.push({
        centerId: s.centerId,
        medicineId: s.medicineId,
        medicineName: m.name,
        severity: warningSeverity(d),
        daysOfStock: Number(d.toFixed(1)),
        qtyOnHand: s.qtyOnHand,
        avgDailyConsumption14d: s.avgDailyConsumption14d,
        reason: `Only ${Number(d.toFixed(1))} days of stock left (reorder lead ${m.leadTimeDays}d, reorder point ${m.reorderPoint}${m.unit})`,
        suggestedAction: d <= 1 ? 'Emergency redistribution or same-day resupply' : 'Raise purchase order and check nearby surplus',
      })
    }
  }
  const sevRank = { critical: 0, high: 1, med: 2, low: 3 }
  warnings.sort((a, b) => sevRank[a.severity] - sevRank[b.severity])
  return warnings
}

function buildForecast(days) {
  const stock = readJson('stock.json')
  const meds = readJson('medicines.json')
  const out = []
  for (const s of stock) {
    const m = meds.find((mm) => mm.id === s.medicineId)
    if (!m) continue
    const base = s.avgDailyConsumption14d
    const issuedToday = s.qtyIssuedToday
    const trend = base > 0 ? (issuedToday - base) / base : 0
    const clampedTrend = Math.max(-0.3, Math.min(0.3, trend))
    const projected = base * days * (1 + clampedTrend * 0.5) * 1.15
    const confidence = days <= 7 ? 'high' : Math.abs(clampedTrend) < 0.15 ? 'med' : 'low'
    out.push({
      centerId: s.centerId,
      medicineId: s.medicineId,
      medicineName: m.name,
      days,
      qtyForecast: Math.ceil(projected),
      confidence,
      rationale: `14-day avg ${base}${m.unit}/day, today issued ${issuedToday}, trend ${(clampedTrend * 100).toFixed(0)}%, 15% safety buffer`,
    })
  }
  return out
}

function buildRedistribution() {
  const centers = readJson('centers.json')
  const stock = readJson('stock.json')
  const meds = readJson('medicines.json')
  const results = []
  const districts = [...new Set(centers.map((c) => c.district))]
  for (const district of districts) {
    const districtCenters = centers.filter((c) => c.district === district)
    const ids = new Set(districtCenters.map((c) => c.id))
    const medIds = [...new Set(stock.filter((s) => ids.has(s.centerId)).map((s) => s.medicineId))]
    for (const medId of medIds) {
      const m = meds.find((mm) => mm.id === medId)
      if (!m) continue
      const rows = stock.filter((s) => ids.has(s.centerId) && s.medicineId === medId)
      const surplus = rows
        .map((s) => ({ s, d: daysOfStock(s.qtyOnHand, s.avgDailyConsumption14d) }))
        .filter((r) => r.d >= m.criticalMin / Math.max(r.s.avgDailyConsumption14d, 1) + 5 && r.s.qtyOnHand > m.reorderPoint * 1.5)
      const deficit = rows
        .map((s) => ({ s, d: daysOfStock(s.qtyOnHand, s.avgDailyConsumption14d) }))
        .filter((r) => r.d <= m.leadTimeDays)
      if (!surplus.length || !deficit.length) continue
      const topSurplus = surplus.sort((a, b) => b.d - a.d)[0]
      const worstDeficit = deficit.sort((a, b) => a.d - b.d)[0]
      if (topSurplus.s.centerId === worstDeficit.s.centerId) continue
      const needQty = Math.ceil(worstDeficit.s.avgDailyConsumption14d * (m.leadTimeDays + 2) - worstDeficit.s.qtyOnHand)
      const availQty = topSurplus.s.qtyOnHand - Math.ceil(topSurplus.s.avgDailyConsumption14d * 7)
      const qty = Math.max(0, Math.min(needQty, availQty))
      if (qty <= 0) continue
      results.push({
        district,
        fromCenter: topSurplus.s.centerId,
        toCenter: worstDeficit.s.centerId,
        medicineId: medId,
        medicineName: m.name,
        qty,
        unit: m.unit,
        feasibility: 'high',
        reason: `Surplus at ${topSurplus.s.centerId} (${Number(topSurplus.d.toFixed(1))}d cover) vs deficit at ${worstDeficit.s.centerId} (${Number(worstDeficit.d.toFixed(1))}d cover)`,
      })
    }
  }
  return results
}

function buildFlags() {
  const centers = readJson('centers.json')
  const stock = readJson('stock.json')
  const meds = readJson('medicines.json')
  const beds = readJson('beds.json')
  const doctors = readJson('doctors.json')
  const tests = readJson('tests.json')
  const warnings = buildWarnings()
  const flags = []
  for (const c of centers) {
    const reasons = []
    const interventions = []
    const cStock = stock.filter((s) => s.centerId === c.id)
    let stockRisk = 0
    if (cStock.length) {
      const atRisk = cStock.filter((s) => {
        const m = meds.find((mm) => mm.id === s.medicineId)
        if (!m) return false
        const d = daysOfStock(s.qtyOnHand, s.avgDailyConsumption14d)
        return d <= m.leadTimeDays
      })
      stockRisk = atRisk.length / cStock.length
      if (stockRisk > 0) reasons.push(`${atRisk.length}/${cStock.length} medicines at stock-out risk`)
      if (stockRisk > 0.3) interventions.push('Emergency resupply or district transfer')
    }
    const cBeds = beds.find((b) => b.centerId === c.id)
    let bedScore = 0.5
    if (cBeds && cBeds.total > 0) {
      bedScore = cBeds.available / cBeds.total
      if (bedScore < 0.15) {
        reasons.push(`Only ${cBeds.available}/${cBeds.total} beds free`)
        interventions.push('Divert admissions to nearby centre')
      }
    }
    const cDocs = doctors.filter((d) => d.centerId === c.id)
    let attendancePct = 1
    if (cDocs.length) {
      const present = cDocs.reduce((a, d) => a + d.present.length, 0)
      const total = cDocs.reduce((a, d) => a + d.total, 0)
      attendancePct = total ? present / total : 1
      if (attendancePct < 0.75) {
        reasons.push(`Doctor attendance ${(attendancePct * 100).toFixed(0)}%`)
        interventions.push('Alert district for duty roster review')
      }
    }
    const cTests = tests.filter((t) => t.centerId === c.id)
    let testPct = 1
    if (cTests.length) {
      testPct = cTests.filter((t) => t.available).length / cTests.length
      if (testPct < 1) {
        reasons.push(`${cTests.filter((t) => !t.available).map((t) => t.testType).join(', ')} unavailable`)
        interventions.push('Restore test service or refer patients')
      }
    }
    const score = stockRisk * 0.4 + (1 - Math.min(attendancePct, 1)) * 0.25 + (1 - Math.min(bedScore / 0.3, 1)) * 0.2 + (1 - testPct) * 0.15
    const wCount = warnings.filter((w) => w.centerId === c.id).length
    if (score >= 0.6 || wCount >= 2) {
      flags.push({
        centerId: c.id,
        centerName: c.name,
        type: c.type,
        score: Number(Math.min(score, 1).toFixed(2)),
        reasons: reasons.length ? reasons : [`${wCount} active stock warnings`],
        interventions: interventions.length ? interventions : ['Schedule resource audit'],
        status: score >= 0.8 ? 'critical' : score >= 0.6 ? 'high' : 'med',
      })
    }
  }
  flags.sort((a, b) => b.score - a.score)
  return flags
}

function centerOverview(id) {
  const centers = readJson('centers.json')
  const c = centers.find((x) => x.id === id)
  if (!c) return null
  const stock = readJson('stock.json').filter((s) => s.centerId === id)
  const beds = readJson('beds.json').find((b) => b.centerId === id)
  const doctors = readJson('doctors.json').filter((d) => d.centerId === id)
  const tests = readJson('tests.json').filter((t) => t.centerId === id)
  const footfall = readJson('footfall.json').filter((f) => f.centerId === id)
  const meds = readJson('medicines.json')
  const warnings = buildWarnings().filter((w) => w.centerId === id)
  let attendancePct = 100
  if (doctors.length) {
    const present = doctors.reduce((a, d) => a + d.present.length, 0)
    const total = doctors.reduce((a, d) => a + d.total, 0)
    attendancePct = total ? Math.round((present / total) * 100) : 100
  }
  const footfallToday = footfall.filter((f) => f.date === '2026-10-18').reduce((a, f) => a + f.count, 0)
  const testPct = tests.length ? Math.round((tests.filter((t) => t.available).length / tests.length) * 100) : 100
  const lowStock = stock.filter((s) => {
    const m = meds.find((mm) => mm.id === s.medicineId)
    if (!m) return false
    return daysOfStock(s.qtyOnHand, s.avgDailyConsumption14d) <= m.leadTimeDays
  }).length
  return {
    ...c,
    kpis: {
      lowStock,
      footfallToday,
      bedsAvailable: beds ? beds.available : 0,
      bedsTotal: beds ? beds.total : 0,
      bedOccupancyPct: beds && beds.total ? Math.round(((beds.total - beds.available) / beds.total) * 100) : 0,
      attendancePct,
      testAvailabilityPct: testPct,
      openWarnings: warnings.length,
    },
    warnings,
  }
}

function districtKpis() {
  const centers = readJson('centers.json')
  const stock = readJson('stock.json')
  const beds = readJson('beds.json')
  const doctors = readJson('doctors.json')
  const tests = readJson('tests.json')
  const meds = readJson('medicines.json')
  const warnings = buildWarnings()
  const totalBeds = beds.reduce((a, b) => a + b.total, 0)
  const occupiedBeds = beds.reduce((a, b) => a + b.occupied, 0)
  const present = doctors.reduce((a, d) => a + d.present.length, 0)
  const totalDocs = doctors.reduce((a, d) => a + d.total, 0)
  const stockRisk = stock.filter((s) => {
    const m = meds.find((mm) => mm.id === s.medicineId)
    if (!m) return false
    return daysOfStock(s.qtyOnHand, s.avgDailyConsumption14d) <= m.leadTimeDays
  }).length
  return {
    centers: centers.length,
    activeFlags: buildFlags().length,
    stockRisk,
    bedOccupancyPct: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    attendancePct: totalDocs ? Math.round((present / totalDocs) * 100) : 100,
    testAvailabilityPct: tests.length ? Math.round((tests.filter((t) => t.available).length / tests.length) * 100) : 100,
    openWarnings: warnings.length,
  }
}

app.get('/api/centers', (req, res) => res.json(readJson('centers.json')))

app.get('/api/centers/:id/overview', (req, res) => {
  const o = centerOverview(req.params.id)
  if (!o) return res.status(404).json({ error: 'not found' })
  res.json(o)
})

app.get('/api/district/kpis', (req, res) => res.json(districtKpis()))

app.get('/api/medicines', (req, res) => res.json(readJson('medicines.json')))

app.get('/api/inventory', (req, res) => {
  const centers = readJson('centers.json')
  const meds = readJson('medicines.json')
  let s = readJson('stock.json')
  if (req.query.centerId) s = s.filter((x) => x.centerId === req.query.centerId)
  if (req.query.medicineId) s = s.filter((x) => x.medicineId === req.query.medicineId)
  const rows = s.map((x) => {
    const m = meds.find((mm) => mm.id === x.medicineId)
    const c = centers.find((cc) => cc.id === x.centerId)
    const d = daysOfStock(x.qtyOnHand, x.avgDailyConsumption14d)
    let status = 'ok'
    if (m) {
      if (d <= 1) status = 'critical'
      else if (d <= m.leadTimeDays) status = 'high'
      else if (d <= m.leadTimeDays * 2) status = 'med'
      if (x.qtyOnHand <= m.criticalMin) status = 'critical'
    }
    const nearExpiry = (x.expiryDates || []).some((e) => new Date(e) - Date.now() < 1000 * 60 * 60 * 24 * 60)
    return {
      ...x,
      medicineName: m ? m.name : x.medicineId,
      unit: m ? m.unit : '',
      criticalMin: m ? m.criticalMin : 0,
      reorderPoint: m ? m.reorderPoint : 0,
      leadTimeDays: m ? m.leadTimeDays : 0,
      centerName: c ? c.name : x.centerId,
      centerType: c ? c.type : '',
      daysOfStock: Number.isFinite(d) ? Number(d.toFixed(1)) : 999,
      status,
      nearExpiry,
    }
  })
  const sevRank = { critical: 0, high: 1, med: 2, ok: 3 }
  rows.sort((a, b) => sevRank[a.status] - sevRank[b.status])
  res.json(rows)
})

app.get('/api/footfall', (req, res) => {
  let f = readJson('footfall.json')
  if (req.query.centerId) f = f.filter((x) => x.centerId === req.query.centerId)
  res.json(f)
})

app.get('/api/beds', (req, res) => {
  let b = readJson('beds.json')
  if (req.query.centerId) b = b.filter((x) => x.centerId === req.query.centerId)
  res.json(b)
})

app.get('/api/attendance', (req, res) => {
  const centers = readJson('centers.json')
  let d = readJson('doctors.json')
  if (req.query.centerId) d = d.filter((x) => x.centerId === req.query.centerId)
  const rows = d.map((x) => {
    const c = centers.find((cc) => cc.id === x.centerId)
    const pct = x.total ? Math.round((x.present.length / x.total) * 100) : 100
    return {
      ...x,
      centerName: c ? c.name : x.centerId,
      centerType: c ? c.type : '',
      presentCount: x.present.length,
      absentCount: x.absent.length,
      attendancePct: pct,
      status: pct >= 80 ? 'ok' : pct >= 60 ? 'med' : 'critical',
    }
  })
  res.json(rows)
})

app.get('/api/attendance/summary', (req, res) => {
  const rows = readJson('doctors.json')
  const present = rows.reduce((a, d) => a + d.present.length, 0)
  const total = rows.reduce((a, d) => a + d.total, 0)
  const absent = total - present
  res.json({
    present,
    absent,
    total,
    attendancePct: total ? Math.round((present / total) * 100) : 100,
    shifts: [...new Set(rows.map((r) => r.shift))],
    compliantShifts: rows.filter((r) => r.total && r.present.length / r.total >= 0.8).length,
    totalShifts: rows.length,
  })
})

app.get('/api/tests', (req, res) => {
  const centers = readJson('centers.json')
  let t = readJson('tests.json')
  if (req.query.centerId) t = t.filter((x) => x.centerId === req.query.centerId)
  const rows = t.map((x) => {
    const c = centers.find((cc) => cc.id === x.centerId)
    const load = x.capacityPerDay ? Math.round((x.doneToday / x.capacityPerDay) * 100) : 0
    return { ...x, centerName: c ? c.name : x.centerId, centerType: c ? c.type : '', loadPct: load }
  })
  res.json(rows)
})

app.get('/api/alerts', (req, res) => {
  const centers = readJson('centers.json')
  let a = readJson('alerts.json')
  const st = req.query.status
  if (st && st !== 'all') a = a.filter((x) => x.status === st)
  if (req.query.severity) a = a.filter((x) => x.severity === req.query.severity)
  res.json(
    a.map((x) => {
      const c = centers.find((cc) => cc.id === x.centerId)
      return { ...x, centerName: c ? c.name : x.centerId, centerType: c ? c.type : '' }
    }),
  )
})

app.post('/api/alerts/:id/ack', (req, res) => {
  const file = path.join(dataDir, 'alerts.json')
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
  const list = JSON.parse(raw)
  const item = list.find((x) => x.id === req.params.id)
  if (!item) return res.status(404).json({ error: 'not found' })
  item.status = 'ack'
  fs.writeFileSync(file, JSON.stringify(list, null, 2))
  res.json(item)
})

app.get('/api/ai/warnings', (req, res) => {
  let w = buildWarnings()
  if (req.query.centerId) w = w.filter((x) => x.centerId === req.query.centerId)
  res.json(w)
})

app.get('/api/ai/forecast', (req, res) => {
  const days = Number(req.query.days) === 30 ? 30 : 7
  let f = buildForecast(days)
  if (req.query.centerId) f = f.filter((x) => x.centerId === req.query.centerId)
  if (req.query.medicineId) f = f.filter((x) => x.medicineId === req.query.medicineId)
  res.json(f)
})

app.get('/api/ai/redistribution', (req, res) => res.json(buildRedistribution()))

app.get('/api/ai/flags', (req, res) => res.json(buildFlags()))

const port = process.env.PORT || 3001
app.listen(port, () => console.log('backend ' + port))
