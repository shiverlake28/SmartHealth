import { useParams } from 'react-router-dom';
export default function CenterDetail() {
  const { id } = useParams();
  return (
    <div className='rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4'>
      <h1 className='text-xl font-semibold'>Center {id}</h1>
      <div className='text-sm text-zinc-400 mt-2'>Overview, Inventory, Footfall, Beds, Attendance, Tests, AI</div>
    </div>
  );
}

