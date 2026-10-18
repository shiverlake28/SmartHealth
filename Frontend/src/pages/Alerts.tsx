import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Alert } from '../types/domain';
export default function Alerts() {
  const [list, setList] = useState<Alert[]>([]);
  useEffect(()=>{ api.get<Alert[]>('/api/alerts?status=all').then(setList); },[]);
  return (
    <div className='rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4'>
      <h1 className='text-xl font-semibold mb-3'>Alerts</h1>
      <div className='text-sm space-y-2'>
        {list.map(a=> <div key={a.id} className='flex justify-between border-t border-white/5 py-2'><div>{a.centerId} - {a.message}</div><div className='text-zinc-400'>{a.severity} {a.status}</div></div>)}
      </div>
    </div>
  );
}

