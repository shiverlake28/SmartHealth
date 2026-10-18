import type { Warning } from '../../lib/ai';
export function WarningsList({ items }: { items: Warning[] }) {
  return (
    <div className='rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4'>
      <h2 className='font-medium mb-2'>Stock Warnings</h2>
      <ul className='text-sm space-y-2'>
        {items.map((w,i)=>(
          <li key={i} className='flex justify-between border-t border-white/5 py-2'><div>{w.centerId}:{w.medicineId} ({w.daysOfStock}d)</div><div>{w.severity}</div></li>
        ))}
      </ul>
    </div>
  );
}

