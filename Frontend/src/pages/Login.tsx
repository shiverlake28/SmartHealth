import { useNavigate } from 'react-router-dom';
import { Heart, LogIn } from 'lucide-react';
import { useState } from 'react';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };
  return (
    <div className='min-h-screen bg-gradient-to-br from-[#0b1026] via-[#0f1a3a] to-[#0b1026] text-white flex items-center justify-center px-4'>
      <div className='w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl'>
        <div className='flex flex-col items-center mb-6'>
          <Heart size={48} className='text-blue-400 mb-2'/>
          <h1 className='text-2xl font-semibold'>Welcome Back</h1>
          <p className='text-sm text-zinc-400'>Login to Smart Health</p>
        </div>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <input type='email' placeholder='Email' value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className='w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400' required/>
          <input type='password' placeholder='Password' value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className='w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400' required/>
          <button type='submit' className='w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center gap-2 hover:opacity-90 transition'><LogIn size={18}/>Login</button>
        </form>
        <p className='text-center text-sm text-zinc-400 mt-4'>Don't have account? <button onClick={()=>navigate('/register')} className='text-blue-400 hover:underline'>Register</button></p>
      </div>
    </div>
  );
}

