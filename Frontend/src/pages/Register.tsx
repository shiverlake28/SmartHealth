import { useNavigate } from 'react-router-dom';
import { Heart, UserPlus } from 'lucide-react';
import { useState } from 'react';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'district_admin' });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };
  return (
    <div className='min-h-screen bg-gradient-to-br from-[#0b1026] via-[#0f1a3a] to-[#0b1026] text-white flex items-center justify-center px-4'>
      <div className='w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl'>
        <div className='flex flex-col items-center mb-6'>
          <Heart size={48} className='text-green-400 mb-2'/>
          <h1 className='text-2xl font-semibold'>Create Account</h1>
          <p className='text-sm text-zinc-400'>Join Smart Health</p>
        </div>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <input type='text' placeholder='Full Name' value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className='w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-400' required/>
          <input type='email' placeholder='Email' value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className='w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-400' required/>
          <input type='password' placeholder='Password' value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className='w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-400' required/>
          <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className='w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-400'>
            <option value='district_admin'>District Admin</option>
            <option value='phc_incharge'>PHC Incharge</option>
            <option value='chc_incharge'>CHC Incharge</option>
          </select>
          <button type='submit' className='w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center gap-2 hover:opacity-90 transition'><UserPlus size={18}/>Register</button>
        </form>
        <p className='text-center text-sm text-zinc-400 mt-4'>Already have account? <button onClick={()=>navigate('/login')} className='text-green-400 hover:underline'>Login</button></p>
      </div>
    </div>
  );
}

