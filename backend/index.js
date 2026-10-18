const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, 'data');

function readJson(file){
  try{ return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8')); } catch(e){ return []; }
}

function daysOfStock(qty, avg){
  if(!avg || avg <= 0) return Infinity;
  return qty / avg;
}

app.get('/api/centers', (req,res)=>{
  res.json(readJson('centers.json'));
});

app.get('/api/centers/:id/overview', (req,res)=>{
  const centers = readJson('centers.json');
  const c = centers.find(x=>x.id===req.params.id);
  res.json(c||null);
});

app.get('/api/inventory', (req,res)=>{
  let s = readJson('stock.json');
  if(req.query.centerId) s = s.filter(x=>x.centerId===req.query.centerId);
  res.json(s);
});

app.get('/api/footfall', (req,res)=>{
  let f = readJson('footfall.json');
  if(req.query.centerId) f = f.filter(x=>x.centerId===req.query.centerId);
  res.json(f);
});

app.get('/api/beds', (req,res)=>{
  let b = readJson('beds.json');
  if(req.query.centerId) b = b.filter(x=>x.centerId===req.query.centerId);
  res.json(b);
});

app.get('/api/attendance', (req,res)=>{
  let d = readJson('doctors.json');
  if(req.query.centerId) d = d.filter(x=>x.centerId===req.query.centerId);
  res.json(d);
});

app.get('/api/tests', (req,res)=>{
  let t = readJson('tests.json');
  if(req.query.centerId) t = t.filter(x=>x.centerId===req.query.centerId);
  res.json(t);
});

app.get('/api/alerts', (req,res)=>{
  let a = readJson('alerts.json');
  const st = req.query.status;
  if(st && st!=='all') a = a.filter(x=>x.status===st);
  res.json(a);
});

app.post('/api/alerts/:id/ack', (req,res)=>{
  res.json({ ok: true, id: req.params.id });
});

app.get('/api/ai/warnings', (req,res)=>{
  const centers = readJson('centers.json');
  const stock = readJson('stock.json');
  const meds = readJson('medicines.json');
  const warnings = [];
  for(const s of stock){
    const m = meds.find(mm=>mm.id===s.medicineId);
    const c = centers.find(cc=>cc.id===s.centerId);
    if(!m || !c) continue;
    const d = daysOfStock(s.qtyOnHand, s.avgDailyConsumption14d);
    let sev = null;
    if(d <= 1) sev='critical'; else if(d <= 2) sev='high'; else if(d <= m.reorderPoint*0.1?false:d <= m.reorderPoint) { /* simple */ }
    if(d <= m.reorderPoint || d <= m.leadTimeDays*0.8){
      if(d <= 1) sev='critical'; else if(d <= 2) sev='high'; else sev='med';
      warnings.push({ centerId:s.centerId, medicineId:s.medicineId, severity:sev, daysOfStock:+d.toFixed(1), reason:'Low days-of-stock vs reorder/lead', suggestedAction:'Consider transfer/reorder' });
    }
  }
  res.json(warnings);
});

app.get('/api/ai/forecast', (req,res)=>{
  res.json([]);
});
app.get('/api/ai/redistribution', (req,res)=>{
  res.json([]);
});
app.get('/api/ai/flags', (req,res)=>{
  res.json([]);
});

const port = 3001;
app.listen(port, ()=>{ console.log('backend', port); });
