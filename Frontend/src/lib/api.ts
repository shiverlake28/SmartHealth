const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error('API error');
  return res.json() as Promise<T>;
}

export const api = { get };

