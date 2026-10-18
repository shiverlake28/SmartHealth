import type { Flag } from '../../lib/ai';
export function FlagsList({ items }: { items: Flag[] }) {
  return (
    <div className='rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4'>
      <h2 className='font-medium mb-2'>AI Flags</h2>
      <ul className='text-sm space-y-2'>
        {items.map((f,i)=>(
          <li key={i} className='flex justify-between border-t border-white/5 py-2'><div>{f.centerId}</div><div>{f.score.toFixed(2)}</div></li>
        ))}
      </ul>
    </div>
  );
}

