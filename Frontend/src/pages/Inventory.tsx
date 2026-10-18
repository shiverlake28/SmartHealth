import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { StockItem } from '../types/domain';
export default function Inventory() {
  const [items, setItems] = useState<StockItem[]>([]);
  useEffect(()=>{ api.get<StockItem[]>('/api/inventory').then(setItems); },[]);
  return (
    <div className='rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4'>
      <h1 className='text-xl font-semibold mb-3'>Inventory</h1>
      <div className='overflow-auto'>
        <table className='w-full text-sm'>
          <thead><tr className='text-zinc-400'><th className='text-left p-2'>Center</th><th className='text-left p-2'>Medicine</th><th className='text-right p-2'>Qty</th><th className='text-right p-2'>Avg/day</th><th className='text-right p-2'>Issued</th><th className='text-right p-2'>Received</th></tr></thead>
          <tbody>
            {items.map((it,i)=> <tr key={i} className='border-t border-white/5'><td className='p-2'>{it.centerId}</td><td className='p-2'>{it.medicineId}</td><td className='p-2 text-right'>{it.qtyOnHand}</td><td className='p-2 text-right'>{it.avgDailyConsumption14d}</td><td className='p-2 text-right'>{it.qtyIssuedToday}</td><td className='p-2 text-right'>{it.qtyReceivedToday}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

