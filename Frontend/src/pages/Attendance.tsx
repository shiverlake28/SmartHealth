import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Doctors } from '../types/domain';
export default function Attendance() {
  const [list, setList] = useState<Doctors[]>([]);
  useEffect(()=>{ api.get<Doctors[]>('/api/attendance').then(setList); },[]);
  return (
    <div className='rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4'>
      <h1 className='text-xl font-semibold mb-3'>Attendance</h1>
      <div className='text-sm space-y-2'>
        {list.map((d,i)=> <div key={i} className='flex justify-between border-t border-white/5 py-2'><div>{d.centerId} {d.shift}</div><div>{d.present.length}/{d.total} present</div></div>)}
      </div>
    </div>
  );
}

